from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.family_member import FamilyMember
from app.schemas.family import FamilyMemberCreate, FamilyMemberUpdate, FamilyMemberResponse


class FamilyService:

    @classmethod
    def add_family_member(cls, db: Session, patient_id: str, req: FamilyMemberCreate) -> FamilyMemberResponse:
        member = FamilyMember(
            patient_id=patient_id,
            name=req.name,
            relation=req.relation,
            photo_url=req.photo_url,
            phone=req.phone,
            notes=req.notes,
            is_emergency_contact=req.is_emergency_contact,
        )
        db.add(member)
        db.commit()
        db.refresh(member)
        return FamilyMemberResponse.model_validate(member)

    @classmethod
    def list_family_members(cls, db: Session, patient_id: str) -> List[FamilyMemberResponse]:
        members = db.query(FamilyMember).filter(FamilyMember.patient_id == patient_id).all()
        return [FamilyMemberResponse.model_validate(m) for m in members]

    @classmethod
    def update_family_member(cls, db: Session, member_id: str, req: FamilyMemberUpdate) -> FamilyMemberResponse:
        member = db.query(FamilyMember).filter(FamilyMember.id == member_id).first()
        if not member:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Family member not found")

        if req.name is not None:
            member.name = req.name
        if req.relation is not None:
            member.relation = req.relation
        if req.photo_url is not None:
            member.photo_url = req.photo_url
        if req.phone is not None:
            member.phone = req.phone
        if req.notes is not None:
            member.notes = req.notes
        if req.is_emergency_contact is not None:
            member.is_emergency_contact = req.is_emergency_contact

        db.commit()
        db.refresh(member)
        return FamilyMemberResponse.model_validate(member)

    @classmethod
    def delete_family_member(cls, db: Session, member_id: str) -> None:
        member = db.query(FamilyMember).filter(FamilyMember.id == member_id).first()
        if not member:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Family member not found")
        db.delete(member)
        db.commit()
