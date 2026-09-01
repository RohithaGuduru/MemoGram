from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.dependencies import get_current_active_user
from app.models.user import User
from app.schemas.memogram import SOSRequest, SOSResponse
from app.services.sos_service import SOSService

router = APIRouter(prefix="/sos", tags=["SOS Emergency Assistance"])


@router.post("/trigger", response_model=SOSResponse, status_code=status.HTTP_201_CREATED)
def trigger_emergency_sos(
    req: SOSRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Patient triggers emergency SOS.
    Records emergency event and notifies all actively assigned caretakers.
    """
    return SOSService.trigger_sos(db, req)


@router.get("", response_model=List[SOSResponse])
def list_sos_alerts(
    active_only: bool = False,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Lists emergency SOS alerts for assigned patients."""
    return SOSService.list_sos_alerts(db, current_user, active_only)


@router.patch("/{id}/resolve", response_model=SOSResponse)
def resolve_emergency_sos(
    id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Caretaker marks an emergency SOS alert as resolved."""
    return SOSService.resolve_sos(db, id)
