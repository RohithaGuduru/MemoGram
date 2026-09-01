from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.family import (
    FamilyMemberCreate,
    FamilyMemberUpdate,
    FamilyMemberResponse,
)
from app.services.family_service import FamilyService
from app.core.dependencies import verify_patient_access, require_caregiver
from app.models.patient import Patient
from app.models.user import User

router = APIRouter(tags=["Family Members"])


@router.post(
    "/patients/{id}/family",
    response_model=FamilyMemberResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_family_member(
    id: str,
    req: FamilyMemberCreate,
    patient: Patient = Depends(verify_patient_access),
    current_user: User = Depends(require_caregiver),
    db: Session = Depends(get_db),
):
    """Adds a family member contact or emergency relation to a patient."""
    return FamilyService.add_family_member(db, patient.id, req)


@router.get(
    "/patients/{id}/family",
    response_model=List[FamilyMemberResponse],
)
def list_family_members(
    id: str,
    patient: Patient = Depends(verify_patient_access),
    db: Session = Depends(get_db),
):
    """Lists all family members and emergency contacts registered for a patient."""
    return FamilyService.list_family_members(db, patient.id)


@router.put(
    "/family/{id}",
    response_model=FamilyMemberResponse,
)
def update_family_member(
    id: str,
    req: FamilyMemberUpdate,
    current_user: User = Depends(require_caregiver),
    db: Session = Depends(get_db),
):
    """Updates family member details or emergency contact status."""
    return FamilyService.update_family_member(db, id, req)


@router.delete(
    "/family/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_family_member(
    id: str,
    current_user: User = Depends(require_caregiver),
    db: Session = Depends(get_db),
):
    """Removes a family member contact."""
    FamilyService.delete_family_member(db, id)
    return None
