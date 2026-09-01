from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session

from app.models.device import Device
from app.models.sync_record import SyncRecord
from app.models.patient import Patient
from app.models.game import Game
from app.models.medication import Medication
from app.models.reminder import Reminder, ReminderLog
from app.models.family_member import FamilyMember
from app.models.cultural_asset import CulturalAsset
from app.schemas.sync import (
    SyncPushRequest,
    SyncPushResponse,
    SyncPullRequest,
    SyncPullResponse,
    SyncOperationItem,
)
from app.schemas.game_session import GameSessionCreate, GameResultSubmit
from app.services.game_service import GameService
from app.services.reminder_service import ReminderService
from app.services.recommendation_service import RecommendationService
from app.utils.enums import SyncOperationType


class SyncService:

    @classmethod
    def process_push_batch(cls, db: Session, req: SyncPushRequest) -> SyncPushResponse:
        now = datetime.now(timezone.utc)

        # 1. Register or update device
        device = db.query(Device).filter(
            Device.patient_id == req.patient_id,
            Device.device_id == req.device_id,
        ).first()

        if device:
            device.last_sync_at = now
            if req.platform:
                device.platform = req.platform
            if req.app_version:
                device.app_version = req.app_version
        else:
            device = Device(
                patient_id=req.patient_id,
                device_id=req.device_id,
                platform=req.platform or "android",
                app_version=req.app_version or "1.0.0",
                last_sync_at=now,
                created_at=now,
            )
            db.add(device)

        successful_ops: List[str] = []
        failed_ops: List[Dict[str, Any]] = []

        # 2. Process each operation idempotently
        for op in req.operations:
            try:
                # Check idempotency via SyncRecord
                existing_sync = db.query(SyncRecord).filter(
                    SyncRecord.client_op_id == op.operation_id
                ).first()

                if existing_sync:
                    # Already executed successfully previously
                    successful_ops.append(op.operation_id)
                    continue

                # Execute entity operation
                cls._execute_sync_operation(db, req.patient_id, op)

                # Record sync operation record
                sync_record = SyncRecord(
                    client_op_id=op.operation_id,
                    patient_id=req.patient_id,
                    device_id=req.device_id,
                    entity_type=op.entity_type,
                    entity_id=op.entity_id,
                    operation=op.operation,
                    client_timestamp=op.timestamp,
                    server_synced_at=now,
                )
                db.add(sync_record)
                db.flush()
                successful_ops.append(op.operation_id)

            except Exception as e:
                db.rollback()
                failed_ops.append({
                    "operation_id": op.operation_id,
                    "error": str(e),
                })

        db.commit()

        return SyncPushResponse(
            processed_count=len(successful_ops),
            successful_op_ids=successful_ops,
            failed_ops=failed_ops,
            server_time=now,
        )

    @classmethod
    def _execute_sync_operation(cls, db: Session, patient_id: str, op: SyncOperationItem) -> None:
        entity_type = op.entity_type.upper()

        if entity_type == "GAME_SESSION":
            # Session start from offline
            game_id = op.data.get("game_id")
            if game_id:
                session_create = GameSessionCreate(
                    client_session_id=op.entity_id,
                    patient_id=patient_id,
                    difficulty=op.data.get("difficulty", 1),
                    device_id=op.data.get("device_id"),
                    started_at=op.timestamp,
                )
                GameService.start_session(db, game_id, session_create)

        elif entity_type == "GAME_RESULT":
            # Session result submitted offline
            session_id = op.data.get("session_id", op.entity_id)
            result_submit = GameResultSubmit(
                total_questions=op.data.get("total_questions", 1),
                correct_answers=op.data.get("correct_answers", 0),
                incorrect_answers=op.data.get("incorrect_answers", 0),
                errors_count=op.data.get("errors_count", 0),
                attempts_count=op.data.get("attempts_count", 1),
                hints_used=op.data.get("hints_used", 0),
                total_time_ms=op.data.get("total_time_ms", 0),
                response_times=op.data.get("response_times", []),
                raw_events=op.data.get("raw_events", []),
                completed_at=op.timestamp,
            )
            GameService.submit_session_result(db, session_id, result_submit)

        elif entity_type == "REMINDER_COMPLETION":
            reminder_id = op.data.get("reminder_id", op.entity_id)
            reminder = db.query(Reminder).filter(Reminder.id == reminder_id).first()
            if reminder:
                reminder.last_completed_at = op.timestamp
                log = ReminderLog(
                    reminder_id=reminder.id,
                    patient_id=patient_id,
                    scheduled_for=op.timestamp,
                    completed_at=op.timestamp,
                    status=op.data.get("status", "COMPLETED"),
                )
                db.add(log)

        elif entity_type == "PATIENT_PREFERENCES":
            patient = db.query(Patient).filter(Patient.id == patient_id).first()
            if patient:
                if "preferred_language" in op.data:
                    patient.preferred_language = op.data["preferred_language"]
                if "font_size" in op.data:
                    patient.font_size = op.data["font_size"]
                if "voice_preference" in op.data:
                    patient.voice_preference = op.data["voice_preference"]
                if "accessibility_preferences" in op.data:
                    patient.accessibility_preferences = op.data["accessibility_preferences"]

    @classmethod
    def pull_patient_delta(cls, db: Session, req: SyncPullRequest) -> SyncPullResponse:
        now = datetime.now(timezone.utc)
        patient_id = req.patient_id

        # Query all active games
        games = db.query(Game).filter(Game.is_active == True).all()
        games_data = [
            {
                "id": g.id,
                "code": g.code,
                "name": g.name,
                "category": g.category.value,
                "description": g.description,
                "min_difficulty": g.min_difficulty,
                "max_difficulty": g.max_difficulty,
                "default_config": g.default_config,
                "metadata_info": g.metadata_info,
            }
            for g in games
        ]

        # Query active medications
        meds = db.query(Medication).filter(
            Medication.patient_id == patient_id,
            Medication.is_active == True,
        ).all()
        meds_data = [
            {
                "id": m.id,
                "name": m.name,
                "dosage": m.dosage,
                "time_of_day": m.time_of_day,
                "frequency": m.frequency,
                "instructions": m.instructions,
                "photo_url": m.photo_url,
            }
            for m in meds
        ]

        # Query active reminders
        reminders = db.query(Reminder).filter(
            Reminder.patient_id == patient_id,
            Reminder.is_active == True,
        ).all()
        reminders_data = [
            {
                "id": r.id,
                "medication_id": r.medication_id,
                "title": r.title,
                "reminder_type": r.reminder_type.value,
                "scheduled_time": r.scheduled_time.strftime("%H:%M:%S"),
                "recurrence_rule": r.recurrence_rule,
            }
            for r in reminders
        ]

        # Query family members
        family = db.query(FamilyMember).filter(FamilyMember.patient_id == patient_id).all()
        family_data = [
            {
                "id": f.id,
                "name": f.name,
                "relation": f.relation,
                "photo_url": f.photo_url,
                "phone": f.phone,
                "is_emergency_contact": f.is_emergency_contact,
            }
            for f in family
        ]

        # Daily activities
        daily_plan = RecommendationService.get_daily_activity_plan(db, patient_id)
        activities_data = [a.model_dump() for a in daily_plan.activities]

        # Cultural assets
        cultural_assets = db.query(CulturalAsset).filter(CulturalAsset.is_active == True).all()
        cultural_data = [
            {
                "id": c.id,
                "asset_code": c.asset_code,
                "category": c.category,
                "language": c.language,
                "region": c.region,
                "title": c.title,
                "asset_url": c.asset_url,
                "metadata_info": c.metadata_info,
            }
            for c in cultural_assets
        ]

        return SyncPullResponse(
            patient_id=patient_id,
            server_time=now,
            games=games_data,
            active_medications=meds_data,
            active_reminders=reminders_data,
            family_members=family_data,
            daily_activities=activities_data,
            cultural_assets=cultural_data,
        )
