from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.dependencies import require_caregiver
from app.models.user import User
from app.schemas.caregiver import CaregiverResponse, CaregiverUpdate
from app.schemas.memogram import RelationshipResponse
from app.services.caregiver_service import CaregiverService
from app.services.relationship_service import RelationshipService

router = APIRouter(prefix="/caretakers", tags=["Caretakers"])


@router.get("/me", response_model=CaregiverResponse)
def get_current_caretaker_profile(
    current_user: User = Depends(require_caregiver),
    db: Session = Depends(get_db),
):
    """Retrieves profile of the authenticated caretaker."""
    profile = CaregiverService.get_caregiver_by_user_id(db, current_user.id)
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Caretaker profile not found")
    return profile


@router.put("/me", response_model=CaregiverResponse)
def update_current_caretaker_profile(
    req: CaregiverUpdate,
    current_user: User = Depends(require_caregiver),
    db: Session = Depends(get_db),
):
    """Updates profile and personal preferences (language, font size) of the authenticated caretaker."""
    from app.models.caregiver import Caregiver
    caregiver = db.query(Caregiver).filter(Caregiver.user_id == current_user.id).first()
    if not caregiver:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Caretaker profile not found")
    return CaregiverService.update_caregiver(db, caregiver.id, req)


@router.get("/me/patients", response_model=List[RelationshipResponse])
def list_assigned_patients(
    current_user: User = Depends(require_caregiver),
    db: Session = Depends(get_db),
):
    """Lists all active relationships/patients assigned to the authenticated caretaker."""
    return RelationshipService.list_relationships(db, current_user)
