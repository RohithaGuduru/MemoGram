from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.patient import (
    PatientCreate,
    PatientUpdate,
    PatientResponse,
    PatientDetailResponse,
)
from app.services.patient_service import PatientService
from app.core.dependencies import (
    require_caregiver,
    verify_patient_access,
    get_current_user,
)
from app.models.user import User
from app.models.patient import Patient

router = APIRouter(prefix="/patients", tags=["Patients"])


@router.post("", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
def create_patient(
    req: PatientCreate,
    current_user: User = Depends(require_caregiver),
    db: Session = Depends(get_db),
):
    """Onboards a new elderly patient and explicitly binds them to the authenticated caregiver."""
    return PatientService.create_patient_with_caregiver(db, req, current_user)


@router.get("", response_model=List[PatientResponse])
def list_patients(
    current_user: User = Depends(require_caregiver),
    db: Session = Depends(get_db),
):
    """Lists all patients assigned to the authenticated caregiver."""
    return PatientService.list_patients_for_caregiver(db, current_user)


@router.get("/{id}", response_model=PatientDetailResponse)
def get_patient_by_id(
    id: str,
    patient: Patient = Depends(verify_patient_access),
    db: Session = Depends(get_db),
):
    """Retrieves full profile details, counts, and primary caregiver for a patient."""
    return PatientService.get_patient_detail(db, patient)


@router.put("/{id}", response_model=PatientDetailResponse)
def update_patient_profile(
    id: str,
    req: PatientUpdate,
    patient: Patient = Depends(verify_patient_access),
    db: Session = Depends(get_db),
):
    """Updates patient preferences, language, font size, or accessibility settings."""
    return PatientService.update_patient(db, patient, req)
