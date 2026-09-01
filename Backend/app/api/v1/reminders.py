from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.reminder import (
    ReminderCreate,
    ReminderUpdate,
    ReminderResponse,
    ReminderLogResponse,
    ReminderCompleteRequest,
)
from app.services.reminder_service import ReminderService
from app.core.dependencies import verify_patient_access, require_caregiver, get_current_user
from app.models.patient import Patient
from app.models.user import User

router = APIRouter(tags=["Reminders"])


@router.post(
    "/patients/{id}/reminders",
    response_model=ReminderResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_reminder(
    id: str,
    req: ReminderCreate,
    patient: Patient = Depends(verify_patient_access),
    current_user: User = Depends(require_caregiver),
    db: Session = Depends(get_db),
):
    """Creates a reminder schedule (Medication, Hydration, Appointment, Cognitive Activity)."""
    return ReminderService.create_reminder(db, patient.id, req)


@router.get(
    "/patients/{id}/reminders",
    response_model=List[ReminderResponse],
)
def list_reminders(
    id: str,
    active_only: bool = False,
    patient: Patient = Depends(verify_patient_access),
    db: Session = Depends(get_db),
):
    """Lists reminders for a patient."""
    return ReminderService.list_reminders(db, patient.id, active_only)


@router.put(
    "/reminders/{id}",
    response_model=ReminderResponse,
)
def update_reminder(
    id: str,
    req: ReminderUpdate,
    current_user: User = Depends(require_caregiver),
    db: Session = Depends(get_db),
):
    """Updates reminder details or timing."""
    return ReminderService.update_reminder(db, id, req)


@router.delete(
    "/reminders/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_reminder(
    id: str,
    current_user: User = Depends(require_caregiver),
    db: Session = Depends(get_db),
):
    """Deletes a reminder schedule."""
    ReminderService.delete_reminder(db, id)
    return None


@router.post(
    "/reminders/{id}/complete",
    response_model=ReminderLogResponse,
)
def complete_reminder(
    id: str,
    req: ReminderCompleteRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Records completion or acknowledgment of a scheduled reminder."""
    return ReminderService.complete_reminder(db, id, req)
