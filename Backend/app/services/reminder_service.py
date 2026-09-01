from datetime import datetime, timezone
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.reminder import Reminder, ReminderLog
from app.schemas.reminder import (
    ReminderCreate,
    ReminderUpdate,
    ReminderResponse,
    ReminderLogResponse,
    ReminderCompleteRequest,
)


class ReminderService:

    @classmethod
    def create_reminder(cls, db: Session, patient_id: str, req: ReminderCreate) -> ReminderResponse:
        reminder = Reminder(
            patient_id=patient_id,
            medication_id=req.medication_id,
            title=req.title,
            description=req.description,
            reminder_type=req.reminder_type,
            scheduled_time=req.scheduled_time,
            recurrence_rule=req.recurrence_rule,
            is_active=req.is_active,
        )
        db.add(reminder)
        db.commit()
        db.refresh(reminder)
        return ReminderResponse.model_validate(reminder)

    @classmethod
    def list_reminders(cls, db: Session, patient_id: str, active_only: bool = False) -> List[ReminderResponse]:
        query = db.query(Reminder).filter(Reminder.patient_id == patient_id)
        if active_only:
            query = query.filter(Reminder.is_active == True)
        reminders = query.order_by(Reminder.scheduled_time.asc()).all()
        return [ReminderResponse.model_validate(r) for r in reminders]

    @classmethod
    def update_reminder(cls, db: Session, reminder_id: str, req: ReminderUpdate) -> ReminderResponse:
        reminder = db.query(Reminder).filter(Reminder.id == reminder_id).first()
        if not reminder:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reminder not found")

        if req.medication_id is not None:
            reminder.medication_id = req.medication_id
        if req.title is not None:
            reminder.title = req.title
        if req.description is not None:
            reminder.description = req.description
        if req.reminder_type is not None:
            reminder.reminder_type = req.reminder_type
        if req.scheduled_time is not None:
            reminder.scheduled_time = req.scheduled_time
        if req.recurrence_rule is not None:
            reminder.recurrence_rule = req.recurrence_rule
        if req.is_active is not None:
            reminder.is_active = req.is_active

        db.commit()
        db.refresh(reminder)
        return ReminderResponse.model_validate(reminder)

    @classmethod
    def delete_reminder(cls, db: Session, reminder_id: str) -> None:
        reminder = db.query(Reminder).filter(Reminder.id == reminder_id).first()
        if not reminder:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reminder not found")
        db.delete(reminder)
        db.commit()

    @classmethod
    def complete_reminder(
        cls,
        db: Session,
        reminder_id: str,
        req: ReminderCompleteRequest,
    ) -> ReminderLogResponse:
        reminder = db.query(Reminder).filter(Reminder.id == reminder_id).first()
        if not reminder:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reminder not found")

        now = datetime.now(timezone.utc)
        completed_time = req.completed_at or now
        scheduled_for = req.scheduled_for or now

        # Update last_completed_at on parent reminder
        reminder.last_completed_at = completed_time

        # Create completion log record
        log = ReminderLog(
            reminder_id=reminder.id,
            patient_id=reminder.patient_id,
            scheduled_for=scheduled_for,
            completed_at=completed_time,
            status=req.status or "COMPLETED",
        )
        db.add(log)
        db.commit()
        db.refresh(log)
        return ReminderLogResponse.model_validate(log)
