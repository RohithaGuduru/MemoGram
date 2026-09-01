from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.caregiver import CaregiverResponse, CaregiverUpdate
from app.services.caregiver_service import CaregiverService
from app.core.dependencies import require_caregiver
from app.models.user import User

router = APIRouter(prefix="/caregivers", tags=["Caregivers"])


@router.get("/me", response_model=CaregiverResponse)
def get_current_caregiver_profile(
    current_user: User = Depends(require_caregiver),
    db: Session = Depends(get_db),
):
    """Retrieves caregiver agency and profile notes for the current user."""
    profile = CaregiverService.get_caregiver_by_user_id(db, current_user.id)
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Caregiver profile not found")
    return profile


@router.put("/{id}", response_model=CaregiverResponse)
def update_caregiver_profile(
    id: str,
    req: CaregiverUpdate,
    current_user: User = Depends(require_caregiver),
    db: Session = Depends(get_db),
):
    """Updates agency notes or metadata for caregiver."""
    return CaregiverService.update_caregiver(db, id, req)
