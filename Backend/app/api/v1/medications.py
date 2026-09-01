from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.medication import (
    MedicationCreate,
    MedicationUpdate,
    MedicationResponse,
)
from app.schemas.memogram import MedicationActionRequest, MedicationActionResponse
from app.services.medication_service import MedicationService
from app.core.dependencies import verify_patient_access, require_caregiver, get_current_active_user
from app.models.patient import Patient
from app.models.user import User

router = APIRouter(tags=["Medications"])


@router.post(
    "/patients/{id}/medications",
    response_model=MedicationResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_medication(
    id: str,
    req: MedicationCreate,
    patient: Patient = Depends(verify_patient_access),
    current_user: User = Depends(require_caregiver),
    db: Session = Depends(get_db),
):
    """Creates a new authoritative medication schedule for a patient."""
    return MedicationService.create_medication(db, patient.id, req)


@router.get(
    "/patients/{id}/medications",
    response_model=List[MedicationResponse],
)
def list_medications(
    id: str,
    active_only: bool = False,
    patient: Patient = Depends(verify_patient_access),
    db: Session = Depends(get_db),
):
    """Lists all active or historical medications configured for a patient."""
    return MedicationService.list_medications(db, patient.id, active_only)


@router.put(
    "/medications/{id}",
    response_model=MedicationResponse,
)
def update_medication(
    id: str,
    req: MedicationUpdate,
    current_user: User = Depends(require_caregiver),
    db: Session = Depends(get_db),
):
    """Updates dosage, schedule timing, or instructions for a medication."""
    return MedicationService.update_medication(db, id, req)


@router.delete(
    "/medications/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_medication(
    id: str,
    current_user: User = Depends(require_caregiver),
    db: Session = Depends(get_db),
):
    """Deactivates/soft-deletes a medication schedule."""
    MedicationService.delete_medication(db, id)
    return None


@router.post(
    "/patients/{patient_id}/medications/{id}/action",
    response_model=MedicationActionResponse,
)
def record_medication_action(
    patient_id: str,
    id: str,
    req: MedicationActionRequest,
    patient: Patient = Depends(verify_patient_access),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Patient records medication action ('TOOK_IT' or 'REMIND_LATER')."""
    return MedicationService.record_patient_action(db, patient.id, id, req)
