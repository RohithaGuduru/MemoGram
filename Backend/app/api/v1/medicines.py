from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.dependencies import require_caregiver, get_current_active_user
from app.models.medication import Medication
from app.models.patient import Patient
from app.models.user import User
from app.schemas.medication import MedicationCreate, MedicationUpdate, MedicationResponse
from app.schemas.memogram import MedicationActionRequest, MedicationActionResponse
from app.services.medication_service import MedicationService

router = APIRouter(prefix="/medicines", tags=["Medicines & Adherence Actions"])


@router.post("/patient/{patient_id}", response_model=MedicationResponse, status_code=status.HTTP_201_CREATED)
def create_medicine(
    patient_id: str,
    req: MedicationCreate,
    current_user: User = Depends(require_caregiver),
    db: Session = Depends(get_db),
):
    """Caretaker creates a new medication schedule for a patient."""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    return MedicationService.create_medication(db, patient.id, req)


@router.get("/patient/{patient_id}", response_model=List[MedicationResponse])
def list_patient_medicines(
    patient_id: str,
    active_only: bool = False,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Lists all scheduled medications for a patient."""
    return MedicationService.list_medications(db, patient_id, active_only)


@router.patch("/{id}", response_model=MedicationResponse)
def update_medicine(
    id: str,
    req: MedicationUpdate,
    current_user: User = Depends(require_caregiver),
    db: Session = Depends(get_db),
):
    """Caretaker updates medication details."""
    return MedicationService.update_medication(db, id, req)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_medicine(
    id: str,
    current_user: User = Depends(require_caregiver),
    db: Session = Depends(get_db),
):
    """Caretaker deactivates/removes medication."""
    MedicationService.delete_medication(db, id)
    return None


@router.post("/{id}/action", response_model=MedicationActionResponse)
def record_medicine_action(
    id: str,
    req: MedicationActionRequest,
    patient_id: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Patient records medication interaction:
    'TOOK_IT' -> Marks dose as taken.
    'REMIND_LATER' -> Snoozes reminder.
    """
    med = db.query(Medication).filter(Medication.id == id).first()
    if not med:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medication not found")
    target_patient_id = patient_id or med.patient_id
    return MedicationService.record_patient_action(db, target_patient_id, id, req)
