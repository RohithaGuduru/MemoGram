from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.medication import Medication
from app.models.reminder import Reminder, ReminderLog
from app.schemas.medication import MedicationCreate, MedicationUpdate, MedicationResponse
from app.schemas.memogram import MedicationActionRequest, MedicationActionResponse
from app.utils.enums import MedicationActionType


class MedicationService:

    @classmethod
    def create_medication(cls, db: Session, patient_id: str, req: MedicationCreate) -> MedicationResponse:
        med = Medication(
            patient_id=patient_id,
            name=req.name,
            dosage=req.dosage,
            time_of_day=req.time_of_day,
            frequency=req.frequency,
            start_date=req.start_date,
            end_date=req.end_date,
            instructions=req.instructions,
            photo_url=req.photo_url,
            is_active=req.is_active,
        )
        db.add(med)
        db.commit()
        db.refresh(med)
        return MedicationResponse.model_validate(med)

    @classmethod
    def list_medications(cls, db: Session, patient_id: str, active_only: bool = False) -> List[MedicationResponse]:
        query = db.query(Medication).filter(Medication.patient_id == patient_id)
        if active_only:
            query = query.filter(Medication.is_active == True)
        meds = query.order_by(Medication.created_at.desc()).all()
        return [MedicationResponse.model_validate(m) for m in meds]

    @classmethod
    def update_medication(cls, db: Session, med_id: str, req: MedicationUpdate) -> MedicationResponse:
        med = db.query(Medication).filter(Medication.id == med_id).first()
        if not med:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medication not found")

        if req.name is not None:
            med.name = req.name
        if req.dosage is not None:
            med.dosage = req.dosage
        if req.time_of_day is not None:
            med.time_of_day = req.time_of_day
        if req.frequency is not None:
            med.frequency = req.frequency
        if req.start_date is not None:
            med.start_date = req.start_date
        if req.end_date is not None:
            med.end_date = req.end_date
        if req.instructions is not None:
            med.instructions = req.instructions
        if req.photo_url is not None:
            med.photo_url = req.photo_url
        if req.is_active is not None:
            med.is_active = req.is_active

        db.commit()
        db.refresh(med)
        return MedicationResponse.model_validate(med)

    @classmethod
    def delete_medication(cls, db: Session, med_id: str) -> None:
        med = db.query(Medication).filter(Medication.id == med_id).first()
        if not med:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medication not found")
        med.is_active = False
        db.commit()

    @classmethod
    def record_patient_action(
        cls,
        db: Session,
        patient_id: str,
        med_id: str,
        req: MedicationActionRequest,
    ) -> MedicationActionResponse:
        """Records patient medication interaction ('TOOK_IT' or 'REMIND_LATER')."""
        med = db.query(Medication).filter(
            Medication.id == med_id,
            Medication.patient_id == patient_id,
        ).first()

        if not med:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Medication not found for this patient",
            )

        now = datetime.now(timezone.utc)
        scheduled_for = req.scheduled_for or now

        # Find or link reminder
        reminder = db.query(Reminder).filter(
            Reminder.medication_id == med.id,
            Reminder.patient_id == patient_id,
        ).first()

        reminder_id = reminder.id if reminder else None

        if req.action == MedicationActionType.TOOK_IT:
            status_text = "TAKEN"
            message = f"Recorded '{med.name}' as taken."
        else:
            status_text = "SNOOZED"
            message = f"Reminder for '{med.name}' snoozed by 15 minutes."

        if reminder_id:
            log = ReminderLog(
                reminder_id=reminder_id,
                patient_id=patient_id,
                scheduled_for=scheduled_for,
                completed_at=now,
                status=status_text,
            )
            db.add(log)
            db.commit()

        return MedicationActionResponse(
            medication_id=med.id,
            medication_name=med.name,
            action_recorded=req.action,
            recorded_at=now,
            status=status_text,
            message=message,
        )
