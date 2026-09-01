from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.dependencies import get_current_active_user, require_caregiver
from app.models.user import User
from app.schemas.memogram import (
    RelationshipInviteRequest,
    RelationshipInviteResponse,
    RelationshipVerifyOTPRequest,
    RelationshipResponse,
)
from app.services.relationship_service import RelationshipService
from app.utils.enums import RelationshipStatus

router = APIRouter(prefix="/relationships", tags=["Patient ↔ Caretaker Relationships"])


@router.post("/invite", response_model=RelationshipInviteResponse, status_code=status.HTTP_201_CREATED)
def invite_patient(
    req: RelationshipInviteRequest,
    current_user: User = Depends(require_caregiver),
    db: Session = Depends(get_db),
):
    """
    Caretaker invites a patient by email or phone.
    Generates a secure hashed OTP with 10-minute expiry and max 5 attempts.
    """
    return RelationshipService.invite_patient(db, current_user, req)


@router.post("/verify-otp", response_model=RelationshipResponse)
def verify_otp(
    req: RelationshipVerifyOTPRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Patient or Caretaker enters 6-digit OTP to verify invitation.
    Upon verification, relationship status transitions to ACTIVE.
    """
    return RelationshipService.verify_otp(db, current_user, req)


@router.get("", response_model=List[RelationshipResponse])
def list_my_relationships(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Lists all active and pending relationships for the authenticated user."""
    return RelationshipService.list_relationships(db, current_user)


@router.patch("/{id}/status", response_model=RelationshipResponse)
def update_relationship_status(
    id: str,
    new_status: RelationshipStatus,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Updates status of a relationship (ACTIVE, REJECTED, REVOKED)."""
    return RelationshipService.update_relationship_status(db, current_user, id, new_status)
