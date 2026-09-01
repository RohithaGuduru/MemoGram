from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.caregiver import Caregiver
from app.schemas.caregiver import CaregiverResponse, CaregiverUpdate


class CaregiverService:

    @classmethod
    def get_caregiver_by_user_id(cls, db: Session, user_id: str) -> Optional[CaregiverResponse]:
        caregiver = db.query(Caregiver).filter(Caregiver.user_id == user_id).first()
        if not caregiver:
            return None
        return CaregiverResponse(
            id=caregiver.id,
            user_id=caregiver.user_id,
            full_name=caregiver.user.full_name if caregiver.user else "Caregiver",
            email=caregiver.user.email if caregiver.user else None,
            phone=caregiver.user.phone if caregiver.user else None,
            agency=caregiver.agency,
            notes=caregiver.notes,
            created_at=caregiver.created_at,
        )

    @classmethod
    def update_caregiver(cls, db: Session, caregiver_id: str, req: CaregiverUpdate) -> CaregiverResponse:
        caregiver = db.query(Caregiver).filter(Caregiver.id == caregiver_id).first()
        if not caregiver:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Caregiver not found")
        if req.agency is not None:
            caregiver.agency = req.agency
        if req.notes is not None:
            caregiver.notes = req.notes
        db.commit()
        db.refresh(caregiver)
        return CaregiverResponse(
            id=caregiver.id,
            user_id=caregiver.user_id,
            full_name=caregiver.user.full_name if caregiver.user else "Caregiver",
            email=caregiver.user.email if caregiver.user else None,
            phone=caregiver.user.phone if caregiver.user else None,
            agency=caregiver.agency,
            notes=caregiver.notes,
            created_at=caregiver.created_at,
        )
