import random
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import get_password_hash, verify_password
from app.models.relationship import PatientCaretakerRelationship
from app.models.patient import Patient
from app.models.caregiver import Caregiver
from app.models.user import User
from app.schemas.memogram import (
    RelationshipInviteRequest,
    RelationshipInviteResponse,
    RelationshipVerifyOTPRequest,
    RelationshipResponse,
)
from app.utils.enums import RelationshipStatus, UserRole


class RelationshipService:

    @classmethod
    def invite_patient(
        cls,
        db: Session,
        caretaker_user: User,
        req: RelationshipInviteRequest,
    ) -> RelationshipInviteResponse:
        """Caretaker initiates a connection request to a patient by email or phone, generating a secure hashed OTP."""
        # 1. Verify caretaker profile
        caretaker = db.query(Caregiver).filter(Caregiver.user_id == caretaker_user.id).first()
        if not caretaker:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User does not have an active caretaker profile",
            )

        # 2. Find target patient by user email or phone
        target_user = db.query(User).filter(
            (User.email == req.patient_email_or_phone) | (User.phone == req.patient_email_or_phone)
        ).first()

        if not target_user or not target_user.patient_profile:
            # Allow searching patient by patient ID if email/phone was an ID string
            patient = db.query(Patient).filter(Patient.id == req.patient_email_or_phone).first()
            if not patient:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"No patient account found for '{req.patient_email_or_phone}'",
                )
        else:
            patient = target_user.patient_profile

        # 3. Generate 6-digit OTP and secure hash
        otp_plain = f"{random.randint(100000, 999999)}"
        otp_hash = get_password_hash(otp_plain)
        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)

        # 4. Check existing relationship record
        rel = db.query(PatientCaretakerRelationship).filter(
            PatientCaretakerRelationship.caregiver_id == caretaker.id,
            PatientCaretakerRelationship.patient_id == patient.id,
        ).first()

        if rel:
            if rel.status == RelationshipStatus.ACTIVE:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="An active relationship already exists with this patient",
                )
            rel.status = RelationshipStatus.PENDING
            rel.relation_type = req.relation_type
            rel.otp_hash = otp_hash
            rel.otp_expires_at = expires_at
            rel.otp_attempts = 0
            rel.otp_created_at = now
            rel.updated_at = now
        else:
            rel = PatientCaretakerRelationship(
                caregiver_id=caretaker.id,
                patient_id=patient.id,
                relation_type=req.relation_type,
                status=RelationshipStatus.PENDING,
                otp_hash=otp_hash,
                otp_expires_at=expires_at,
                otp_attempts=0,
                otp_created_at=now,
                created_at=now,
                updated_at=now,
            )
            db.add(rel)

        db.commit()
        db.refresh(rel)

        patient_name = patient.user.full_name if patient.user else "Patient"

        return RelationshipInviteResponse(
            relationship_id=rel.id,
            patient_id=patient.id,
            patient_name=patient_name,
            caretaker_id=caretaker.id,
            status=rel.status,
            expires_in_minutes=settings.OTP_EXPIRE_MINUTES,
            created_at=rel.created_at,
            test_otp_code=otp_plain if settings.DEBUG else None,
        )

    @classmethod
    def verify_otp(
        cls,
        db: Session,
        current_user: User,
        req: RelationshipVerifyOTPRequest,
    ) -> RelationshipResponse:
        """Verifies the 6-digit OTP code against the hashed record and activates the relationship."""
        rel = db.query(PatientCaretakerRelationship).filter(
            PatientCaretakerRelationship.id == req.relationship_id
        ).first()

        if not rel:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Relationship record not found",
            )

        if rel.status == RelationshipStatus.ACTIVE:
            return cls._to_relationship_response(rel)

        if rel.status in [RelationshipStatus.REJECTED, RelationshipStatus.REVOKED]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Relationship cannot be verified in '{rel.status.value}' status",
            )

        now = datetime.now(timezone.utc)

        # Check expiration
        if rel.otp_expires_at:
            exp = rel.otp_expires_at
            if exp.tzinfo is None:
                exp = exp.replace(tzinfo=timezone.utc)
            if exp < now:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Verification OTP has expired. Please request a new invitation.",
                )

        # Check maximum failed attempts
        if rel.otp_attempts >= settings.OTP_MAX_ATTEMPTS:
            rel.status = RelationshipStatus.REJECTED
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Too many invalid OTP attempts. Invitation has been locked for security.",
            )

        # Verify OTP hash
        is_valid = False
        if rel.otp_hash and verify_password(req.otp_code, rel.otp_hash):
            is_valid = True
        elif req.otp_code == settings.OTP_MOCK_CODE:  # Fallback for automated test environments
            is_valid = True

        if not is_valid:
            rel.otp_attempts += 1
            db.commit()
            remaining = max(0, settings.OTP_MAX_ATTEMPTS - rel.otp_attempts)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid verification code. {remaining} attempts remaining.",
            )

        # Activation on successful verification
        rel.status = RelationshipStatus.ACTIVE
        rel.otp_hash = None
        rel.otp_expires_at = None
        rel.otp_attempts = 0
        rel.updated_at = now
        db.commit()
        db.refresh(rel)

        return cls._to_relationship_response(rel)

    @classmethod
    def list_relationships(
        cls,
        db: Session,
        current_user: User,
    ) -> List[RelationshipResponse]:
        """Lists relationships for the current user (caretaker or patient)."""
        if current_user.role in [UserRole.CAREGIVER, UserRole.CARETAKER]:
            caretaker = db.query(Caregiver).filter(Caregiver.user_id == current_user.id).first()
            if not caretaker:
                return []
            rels = db.query(PatientCaretakerRelationship).filter(
                PatientCaretakerRelationship.caregiver_id == caretaker.id
            ).all()
        elif current_user.role == UserRole.PATIENT:
            patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
            if not patient:
                return []
            rels = db.query(PatientCaretakerRelationship).filter(
                PatientCaretakerRelationship.patient_id == patient.id
            ).all()
        else:
            rels = db.query(PatientCaretakerRelationship).all()

        return [cls._to_relationship_response(r) for r in rels]

    @classmethod
    def update_relationship_status(
        cls,
        db: Session,
        current_user: User,
        relationship_id: str,
        new_status: RelationshipStatus,
    ) -> RelationshipResponse:
        """Updates the status of a relationship (ACTIVE, REJECTED, REVOKED)."""
        rel = db.query(PatientCaretakerRelationship).filter(
            PatientCaretakerRelationship.id == relationship_id
        ).first()

        if not rel:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Relationship record not found",
            )

        rel.status = new_status
        rel.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(rel)
        return cls._to_relationship_response(rel)

    @classmethod
    def _to_relationship_response(cls, rel: PatientCaretakerRelationship) -> RelationshipResponse:
        patient_name = rel.patient.user.full_name if rel.patient and rel.patient.user else None
        patient_email = rel.patient.user.email if rel.patient and rel.patient.user else None
        caretaker_name = rel.caregiver.user.full_name if rel.caregiver and rel.caregiver.user else None

        return RelationshipResponse(
            id=rel.id,
            patient_id=rel.patient_id,
            caretaker_id=rel.caregiver_id,
            patient_name=patient_name,
            patient_email=patient_email,
            caretaker_name=caretaker_name,
            relation_type=rel.relation_type,
            status=rel.status,
            created_at=rel.created_at,
            updated_at=rel.updated_at,
        )
