from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.alert import AlertResponse
from app.services.alert_service import AlertService
from app.core.dependencies import verify_patient_access, require_caregiver
from app.models.patient import Patient
from app.models.user import User

router = APIRouter(tags=["Caregiver Alerts"])


@router.get(
    "/patients/{id}/alerts",
    response_model=List[AlertResponse],
)
def list_patient_alerts(
    id: str,
    unread_only: bool = Query(False),
    patient: Patient = Depends(verify_patient_access),
    current_user: User = Depends(require_caregiver),
    db: Session = Depends(get_db),
):
    """Lists caregiver alerts for a patient (e.g. routine drop, difficulty fatigue, missed reminders)."""
    return AlertService.list_alerts_for_patient(db, patient.id, unread_only)


@router.patch(
    "/alerts/{id}/read",
    response_model=AlertResponse,
)
def mark_alert_read(
    id: str,
    current_user: User = Depends(require_caregiver),
    db: Session = Depends(get_db),
):
    """Marks an alert as read by caregiver."""
    return AlertService.mark_as_read(db, id)


@router.patch(
    "/alerts/{id}/resolve",
    response_model=AlertResponse,
)
def mark_alert_resolved(
    id: str,
    current_user: User = Depends(require_caregiver),
    db: Session = Depends(get_db),
):
    """Marks an alert as resolved by caregiver."""
    return AlertService.mark_as_resolved(db, id)
