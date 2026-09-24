from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.models.user import User
from app.models.caregiver import Caregiver
from app.models.patient import Patient
from app.models.caregiver_patient import CaregiverPatient
from app.models.game_session import GameSession
from app.models.medication import Medication
from app.models.reminder import Reminder
from app.models.family_member import FamilyMember
from app.schemas.patient import PatientCreate, PatientUpdate, PatientResponse, PatientDetailResponse
from app.utils.enums import UserRole, SessionStatus


class PatientService:

    @classmethod
    def create_patient_with_caregiver(
        cls,
        db: Session,
        req: PatientCreate,
        caregiver_user: User,
    ) -> PatientResponse:
        # Check email/phone uniqueness if provided
        if req.email:
            if db.query(User).filter(User.email == req.email).first():
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
        if req.phone:
            if db.query(User).filter(User.phone == req.phone).first():
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Phone already registered")

        # 1. Create Patient User account
        hashed_pw = get_password_hash(req.password or "Patient@123")
        patient_user = User(
            email=req.email,
            phone=req.phone,
            hashed_password=hashed_pw,
            full_name=req.full_name,
            role=UserRole.PATIENT,
            is_active=True,
        )
        db.add(patient_user)
        db.flush()

        # 2. Create Patient Profile
        new_patient = Patient(
            user_id=patient_user.id,
            date_of_birth=req.date_of_birth,
            preferred_language=req.preferred_language,
            font_size=req.font_size,
            timezone=req.timezone,
            voice_preference=req.voice_preference,
            interests=req.interests or [],
            accessibility_preferences=req.accessibility_preferences or {
                "high_contrast": False,
                "screen_reader_friendly": True,
                "haptic_feedback": True,
                "audio_cues": True,
                "simplified_ui": True,
                "touch_target_size": "large",
            },
        )
        db.add(new_patient)
        db.flush()

        # 3. Associate with Caregiver if created by Caregiver
        if caregiver_user.role == UserRole.CAREGIVER:
            caregiver = db.query(Caregiver).filter(Caregiver.user_id == caregiver_user.id).first()
            if caregiver:
                assoc = CaregiverPatient(
                    caregiver_id=caregiver.id,
                    patient_id=new_patient.id,
                    relation_type="primary_caregiver",
                    is_primary=True,
                )
                db.add(assoc)

        db.commit()
        db.refresh(new_patient)

        return PatientResponse(
            id=new_patient.id,
            user_id=new_patient.user_id,
            full_name=patient_user.full_name,
            email=patient_user.email,
            phone=patient_user.phone,
            date_of_birth=new_patient.date_of_birth,
            preferred_language=new_patient.preferred_language,
            font_size=new_patient.font_size,
            timezone=new_patient.timezone,
            voice_preference=new_patient.voice_preference,
            interests=new_patient.interests or [],
            accessibility_preferences=new_patient.accessibility_preferences or {},
            created_at=new_patient.created_at,
            updated_at=new_patient.updated_at,
        )

    @classmethod
    def list_patients_for_caregiver(cls, db: Session, caregiver_user: User) -> List[PatientResponse]:
        if caregiver_user.role == UserRole.ADMIN:
            patients = db.query(Patient).all()
        else:
            caregiver = db.query(Caregiver).filter(Caregiver.user_id == caregiver_user.id).first()
            if not caregiver:
                return []
            patients = db.query(Patient).join(
                CaregiverPatient, CaregiverPatient.patient_id == Patient.id
            ).filter(CaregiverPatient.caregiver_id == caregiver.id).all()

        results = []
        for p in patients:
            results.append(
                PatientResponse(
                    id=p.id,
                    user_id=p.user_id,
                    full_name=p.user.full_name if p.user else "Patient",
                    email=p.user.email if p.user else None,
                    phone=p.user.phone if p.user else None,
                    date_of_birth=p.date_of_birth,
                    preferred_language=p.preferred_language,
                    font_size=p.font_size,
                    timezone=p.timezone,
                    voice_preference=p.voice_preference,
                    interests=p.interests or [],
                    accessibility_preferences=p.accessibility_preferences or {},
                    created_at=p.created_at,
                    updated_at=p.updated_at,
                )
            )
        return results

    @classmethod
    def get_patient_detail(cls, db: Session, patient: Patient) -> PatientDetailResponse:
        family_count = db.query(FamilyMember).filter(FamilyMember.patient_id == patient.id).count()
        meds_count = db.query(Medication).filter(Medication.patient_id == patient.id, Medication.is_active == True).count()
        reminders_count = db.query(Reminder).filter(Reminder.patient_id == patient.id, Reminder.is_active == True).count()
        completed_games = db.query(GameSession).filter(
            GameSession.patient_id == patient.id,
            GameSession.status == SessionStatus.COMPLETED
        ).count()

        primary_cg_name = None
        cg_assoc = db.query(CaregiverPatient).filter(
            CaregiverPatient.patient_id == patient.id,
            CaregiverPatient.is_primary == True
        ).first()
        if cg_assoc and cg_assoc.caregiver and cg_assoc.caregiver.user:
            primary_cg_name = cg_assoc.caregiver.user.full_name

        return PatientDetailResponse(
            id=patient.id,
            user_id=patient.user_id,
            full_name=patient.user.full_name if patient.user else "Patient",
            email=patient.user.email if patient.user else None,
            phone=patient.user.phone if patient.user else None,
            date_of_birth=patient.date_of_birth,
            primary_language=patient.primary_language,
            preferred_language=patient.preferred_language,
            font_size=patient.font_size,
            timezone=patient.timezone,
            voice_preference=patient.voice_preference,
            interests=patient.interests or [],
            accessibility_preferences=patient.accessibility_preferences or {},
            created_at=patient.created_at,
            updated_at=patient.updated_at,
            primary_caregiver_name=primary_cg_name,
            family_members_count=family_count,
            active_medications_count=meds_count,
            active_reminders_count=reminders_count,
            completed_games_count=completed_games,
        )

    @classmethod
    def update_patient(cls, db: Session, patient: Patient, req: PatientUpdate) -> PatientResponse:
        if req.full_name and patient.user:
            patient.user.full_name = req.full_name
        if req.phone and patient.user:
            patient.user.phone = req.phone
        if req.date_of_birth is not None:
            patient.date_of_birth = req.date_of_birth
        if req.preferred_language is not None:
            patient.preferred_language = req.preferred_language
            patient.primary_language = req.preferred_language
        elif req.primary_language is not None:
            patient.primary_language = req.primary_language
            patient.preferred_language = req.primary_language
        if req.font_size is not None:
            patient.font_size = req.font_size
        if req.timezone is not None:
            patient.timezone = req.timezone
        if req.voice_preference is not None:
            patient.voice_preference = req.voice_preference
        if req.interests is not None:
            patient.interests = req.interests
        if req.accessibility_preferences is not None:
            patient.accessibility_preferences = req.accessibility_preferences

        db.commit()
        db.refresh(patient)
        return cls.get_patient_detail(db, patient)
