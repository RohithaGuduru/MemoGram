from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session

from app.models.patient import Patient
from app.models.caregiver_patient import CaregiverPatient
from app.models.medication import Medication
from app.models.reminder import Reminder, ReminderLog
from app.models.family_member import FamilyMember
from app.models.game_session import GameSession
from app.models.performance_metric import PerformanceMetric
from app.models.baseline import Baseline
from app.models.performance_trend import PerformanceTrend
from app.services.recommendation_service import RecommendationService
from app.utils.enums import SessionStatus, ReminderType


class AIToolsService:
    """
    FastAPI execution layer for backend tools called by Gemini AI.
    Strictly retrieves data from existing database models.
    Gemini never accesses the database directly.
    """

    # -------------------------------------------------------------------------
    # Tool 1: Patient Profile
    # -------------------------------------------------------------------------
    @classmethod
    def get_patient_profile(cls, db: Session, patient_id: str) -> Dict[str, Any]:
        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        if not patient:
            return {"error": f"Patient with ID {patient_id} not found."}

        full_name = patient.user.full_name if patient.user else "Patient"
        age = None
        if patient.date_of_birth:
            today = datetime.now(timezone.utc).date()
            dob = patient.date_of_birth
            age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))

        primary_cg = None
        cg_assoc = db.query(CaregiverPatient).filter(
            CaregiverPatient.patient_id == patient_id,
            CaregiverPatient.is_primary == True,
        ).first()
        if cg_assoc and cg_assoc.caregiver and cg_assoc.caregiver.user:
            primary_cg = cg_assoc.caregiver.user.full_name

        return {
            "patient_id": patient.id,
            "full_name": full_name,
            "age": age,
            "preferred_language": patient.preferred_language,
            "timezone": patient.timezone,
            "font_size": patient.font_size,
            "voice_preference": patient.voice_preference,
            "interests": patient.interests or [],
            "primary_caregiver": primary_cg,
            "accessibility_preferences": patient.accessibility_preferences or {},
        }

    # -------------------------------------------------------------------------
    # Tool 2: Today's Activities
    # -------------------------------------------------------------------------
    @classmethod
    def get_today_activity(cls, db: Session, patient_id: str) -> Dict[str, Any]:
        now = datetime.now(timezone.utc)
        start_of_day = datetime(now.year, now.month, now.day, 0, 0, 0, tzinfo=timezone.utc)
        end_of_day = datetime(now.year, now.month, now.day, 23, 59, 59, tzinfo=timezone.utc)

        sessions_today = db.query(GameSession).filter(
            GameSession.patient_id == patient_id,
            GameSession.started_at >= start_of_day,
            GameSession.started_at <= end_of_day,
        ).all()

        completed_list = []
        for s in sessions_today:
            game_name = s.game.name if s.game else s.game_category.value
            metric = db.query(PerformanceMetric).filter(PerformanceMetric.session_id == s.id).first()
            completed_list.append({
                "game_name": game_name,
                "category": s.game_category.value.lower(),
                "difficulty": s.difficulty,
                "status": s.status.value.lower(),
                "accuracy": metric.accuracy if metric else None,
                "started_at": s.started_at.strftime("%H:%M"),
            })

        # Fetch today's recommended next game
        rec = None
        try:
            rec_obj = RecommendationService.get_next_recommendation(db, patient_id)
            rec = {
                "game_name": rec_obj.game_name,
                "category": rec_obj.game_category.value.lower(),
                "difficulty": rec_obj.target_difficulty,
                "reason": rec_obj.reason,
            }
        except Exception:
            pass

        return {
            "date": now.strftime("%Y-%m-%d"),
            "total_activities_completed_today": len([s for s in sessions_today if s.status == SessionStatus.COMPLETED]),
            "sessions_today": completed_list,
            "next_recommended_activity": rec,
        }

    # -------------------------------------------------------------------------
    # Tool 3: Next Recommended Game
    # -------------------------------------------------------------------------
    @classmethod
    def get_next_recommended_game(cls, db: Session, patient_id: str) -> Dict[str, Any]:
        try:
            rec = RecommendationService.get_next_recommendation(db, patient_id)
            return {
                "game_id": rec.recommended_game_id,
                "game_name": rec.game_name,
                "game_code": rec.game_code,
                "category": rec.game_category.value.lower(),
                "target_difficulty": rec.target_difficulty,
                "reason": rec.reason,
                "confidence": rec.confidence,
                "plan_date": rec.plan_date.isoformat(),
            }
        except Exception as e:
            return {"error": f"Could not determine recommended game: {str(e)}"}

    # -------------------------------------------------------------------------
    # Tool 4: Upcoming Reminders
    # -------------------------------------------------------------------------
    @classmethod
    def get_upcoming_reminders(cls, db: Session, patient_id: str) -> Dict[str, Any]:
        now = datetime.now(timezone.utc)
        current_time = now.time()
        start_of_day = datetime(now.year, now.month, now.day, 0, 0, 0, tzinfo=timezone.utc)

        reminders = db.query(Reminder).filter(
            Reminder.patient_id == patient_id,
            Reminder.is_active == True,
        ).order_by(Reminder.scheduled_time.asc()).all()

        reminders_data = []
        for r in reminders:
            # Check if completed today
            log = db.query(ReminderLog).filter(
                ReminderLog.reminder_id == r.id,
                ReminderLog.scheduled_for >= start_of_day,
                ReminderLog.status == "COMPLETED",
            ).first()

            med_name = r.medication.name if r.medication else None
            reminders_data.append({
                "id": r.id,
                "title": r.title,
                "description": r.description,
                "type": r.reminder_type.value,
                "scheduled_time": r.scheduled_time.strftime("%H:%M"),
                "is_completed_today": log is not None,
                "medication_name": med_name,
                "is_past_due": (r.scheduled_time < current_time) and (log is None),
            })

        # Next pending reminder
        pending = [r for r in reminders_data if not r["is_completed_today"] and not r["is_past_due"]]
        next_reminder = pending[0] if pending else (reminders_data[0] if reminders_data else None)

        return {
            "current_time": current_time.strftime("%H:%M"),
            "total_active_reminders": len(reminders),
            "next_upcoming_reminder": next_reminder,
            "all_reminders": reminders_data,
        }

    # -------------------------------------------------------------------------
    # Tool 5: Medication Schedule
    # -------------------------------------------------------------------------
    @classmethod
    def get_medication_schedule(cls, db: Session, patient_id: str) -> Dict[str, Any]:
        meds = db.query(Medication).filter(
            Medication.patient_id == patient_id,
            Medication.is_active == True,
        ).all()

        med_list = []
        for m in meds:
            med_list.append({
                "medication_id": m.id,
                "name": m.name,
                "dosage": m.dosage,
                "time_of_day": m.time_of_day,
                "frequency": m.frequency,
                "instructions": m.instructions or "Take as prescribed",
                "start_date": m.start_date.isoformat() if m.start_date else None,
                "end_date": m.end_date.isoformat() if m.end_date else None,
            })

        return {
            "patient_id": patient_id,
            "active_medications_count": len(med_list),
            "medications": med_list,
        }

    # -------------------------------------------------------------------------
    # Tool 6: Next Appointment / Doctor Visit
    # -------------------------------------------------------------------------
    @classmethod
    def get_next_appointment(cls, db: Session, patient_id: str) -> Dict[str, Any]:
        # Search reminders of type APPOINTMENT or check reminder title
        appointment_reminders = db.query(Reminder).filter(
            Reminder.patient_id == patient_id,
            Reminder.is_active == True,
            (Reminder.reminder_type == ReminderType.APPOINTMENT) | (Reminder.title.ilike("%doctor%") | Reminder.title.ilike("%appointment%") | Reminder.title.ilike("%clinic%")),
        ).order_by(Reminder.scheduled_time.asc()).all()

        if not appointment_reminders:
            return {
                "has_upcoming_appointment": False,
                "message": "There are no upcoming appointments scheduled in the system.",
            }

        appt = appointment_reminders[0]
        return {
            "has_upcoming_appointment": True,
            "appointment_title": appt.title,
            "description": appt.description,
            "scheduled_time": appt.scheduled_time.strftime("%H:%M"),
            "recurrence": appt.recurrence_rule,
        }

    # -------------------------------------------------------------------------
    # Tool 7: Recent Performance
    # -------------------------------------------------------------------------
    @classmethod
    def get_recent_performance(cls, db: Session, patient_id: str) -> Dict[str, Any]:
        metrics = db.query(PerformanceMetric).filter(
            PerformanceMetric.patient_id == patient_id
        ).order_by(PerformanceMetric.created_at.desc()).limit(5).all()

        if not metrics:
            return {
                "message": "No completed activity sessions found yet.",
                "sessions": [],
            }

        sessions = []
        for m in metrics:
            game_name = m.game.name if m.game else m.game_category.value
            sessions.append({
                "game_name": game_name,
                "category": m.game_category.value.lower(),
                "difficulty": m.difficulty,
                "accuracy": f"{m.accuracy}%",
                "average_response_time_seconds": round(m.average_response_time_ms / 1000.0, 1),
                "error_rate": f"{m.error_rate}%",
                "date": m.created_at.strftime("%Y-%m-%d %H:%M"),
            })

        return {
            "patient_id": patient_id,
            "recent_sessions_count": len(sessions),
            "sessions": sessions,
        }

    # -------------------------------------------------------------------------
    # Tool 8: Patient Progress
    # -------------------------------------------------------------------------
    @classmethod
    def get_patient_progress(cls, db: Session, patient_id: str) -> Dict[str, Any]:
        baselines = db.query(Baseline).filter(Baseline.patient_id == patient_id).all()
        trends = db.query(PerformanceTrend).filter(PerformanceTrend.patient_id == patient_id).all()
        total_sessions = db.query(PerformanceMetric).filter(PerformanceMetric.patient_id == patient_id).count()

        category_progress = {}
        for b in baselines:
            cat_name = b.game_category.value.lower()
            trend = next((t for t in trends if t.game_category == b.game_category), None)
            category_progress[cat_name] = {
                "baseline_accuracy": f"{b.baseline_accuracy}%",
                "baseline_response_time_seconds": round(b.baseline_response_time_ms / 1000.0, 1),
                "trend_direction": trend.trend_direction.value.lower() if trend else "stable",
                "percentage_change": trend.percentage_change if trend else 0.0,
            }

        return {
            "patient_id": patient_id,
            "total_sessions_completed": total_sessions,
            "cognitive_categories": category_progress,
        }

    # -------------------------------------------------------------------------
    # Tool 9: Family Members
    # -------------------------------------------------------------------------
    @classmethod
    def get_family_members(cls, db: Session, patient_id: str) -> Dict[str, Any]:
        members = db.query(FamilyMember).filter(FamilyMember.patient_id == patient_id).all()

        family_list = []
        for m in members:
            family_list.append({
                "name": m.name,
                "relation": m.relation,
                "is_emergency_contact": m.is_emergency_contact,
                "phone": m.phone if m.is_emergency_contact else None,
                "notes": m.notes,
            })

        return {
            "patient_id": patient_id,
            "family_members_count": len(family_list),
            "family_members": family_list,
        }

    # -------------------------------------------------------------------------
    # Tool Dispatcher
    # -------------------------------------------------------------------------
    @classmethod
    def execute_tool(
        cls,
        tool_name: str,
        arguments: Dict[str, Any],
        db: Session,
        patient_id: str,
    ) -> Dict[str, Any]:
        """
        Executes a named tool called by Gemini.
        Forces the authenticated patient_id to prevent privilege escalation.
        """
        tool_map = {
            "get_patient_profile": cls.get_patient_profile,
            "get_today_activity": cls.get_today_activity,
            "get_next_recommended_game": cls.get_next_recommended_game,
            "get_upcoming_reminders": cls.get_upcoming_reminders,
            "get_medication_schedule": cls.get_medication_schedule,
            "get_next_appointment": cls.get_next_appointment,
            "get_recent_performance": cls.get_recent_performance,
            "get_patient_progress": cls.get_patient_progress,
            "get_family_members": cls.get_family_members,
        }

        if tool_name not in tool_map:
            return {"error": f"Tool '{tool_name}' is not recognized or permitted."}

        target_func = tool_map[tool_name]
        try:
            return target_func(db=db, patient_id=patient_id)
        except Exception as exc:
            return {"error": f"Tool execution failed: {str(exc)}"}

    # -------------------------------------------------------------------------
    # Tool Declarations Specification (for Gemini Function Calling)
    # -------------------------------------------------------------------------
    @classmethod
    def get_tool_declarations(cls) -> List[Dict[str, Any]]:
        return [
            {
                "name": "get_patient_profile",
                "description": "Retrieves the patient's basic profile details including name, age, preferred language, and interests.",
                "parameters": {
                    "type": "OBJECT",
                    "properties": {
                        "patient_id": {"type": "STRING", "description": "The patient ID"}
                    },
                    "required": ["patient_id"],
                },
            },
            {
                "name": "get_today_activity",
                "description": "Retrieves activities completed today and recommended next activities for the patient.",
                "parameters": {
                    "type": "OBJECT",
                    "properties": {
                        "patient_id": {"type": "STRING", "description": "The patient ID"}
                    },
                    "required": ["patient_id"],
                },
            },
            {
                "name": "get_next_recommended_game",
                "description": "Retrieves the next cognitive game or exercise recommended by the MindEase adaptive engine, including category and difficulty level.",
                "parameters": {
                    "type": "OBJECT",
                    "properties": {
                        "patient_id": {"type": "STRING", "description": "The patient ID"}
                    },
                    "required": ["patient_id"],
                },
            },
            {
                "name": "get_upcoming_reminders",
                "description": "Retrieves upcoming schedule reminders including medication, hydration, and activity reminders for today.",
                "parameters": {
                    "type": "OBJECT",
                    "properties": {
                        "patient_id": {"type": "STRING", "description": "The patient ID"}
                    },
                    "required": ["patient_id"],
                },
            },
            {
                "name": "get_medication_schedule",
                "description": "Retrieves the patient's active prescribed medications, dosage details, and time of day schedule.",
                "parameters": {
                    "type": "OBJECT",
                    "properties": {
                        "patient_id": {"type": "STRING", "description": "The patient ID"}
                    },
                    "required": ["patient_id"],
                },
            },
            {
                "name": "get_next_appointment",
                "description": "Retrieves the next doctor visit, clinic appointment, or upcoming scheduled consultation.",
                "parameters": {
                    "type": "OBJECT",
                    "properties": {
                        "patient_id": {"type": "STRING", "description": "The patient ID"}
                    },
                    "required": ["patient_id"],
                },
            },
            {
                "name": "get_recent_performance",
                "description": "Retrieves the patient's recent activity game scores, accuracy percentages, and pacing.",
                "parameters": {
                    "type": "OBJECT",
                    "properties": {
                        "patient_id": {"type": "STRING", "description": "The patient ID"}
                    },
                    "required": ["patient_id"],
                },
            },
            {
                "name": "get_patient_progress",
                "description": "Retrieves overall patient activity progress, domain baselines, and performance trends over recent sessions.",
                "parameters": {
                    "type": "OBJECT",
                    "properties": {
                        "patient_id": {"type": "STRING", "description": "The patient ID"}
                    },
                    "required": ["patient_id"],
                },
            },
            {
                "name": "get_family_members",
                "description": "Retrieves family member details, relation names, and emergency contact designations.",
                "parameters": {
                    "type": "OBJECT",
                    "properties": {
                        "patient_id": {"type": "STRING", "description": "The patient ID"}
                    },
                    "required": ["patient_id"],
                },
            },
        ]
