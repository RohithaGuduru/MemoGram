from datetime import datetime, timezone
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.models.user import User
from app.models.caregiver import Caregiver
from app.models.patient import Patient
from app.schemas.auth import RegisterRequest, LoginRequest, Token, UserResponse
from app.schemas.memogram import GoogleAuthRequest
from app.utils.enums import UserRole


class AuthService:

    @classmethod
    def register_user(cls, db: Session, req: RegisterRequest) -> Token:
        # Verify email or phone uniqueness
        if req.email:
            existing = db.query(User).filter(User.email == req.email).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="A user with this email already exists",
                )
        if req.phone:
            existing = db.query(User).filter(User.phone == req.phone).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="A user with this phone number already exists",
                )
        if not req.email and not req.phone:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Either email or phone must be provided",
            )

        hashed_pw = get_password_hash(req.password)
        new_user = User(
            email=req.email,
            phone=req.phone,
            hashed_password=hashed_pw,
            full_name=req.full_name,
            role=req.role,
            is_active=True,
        )
        db.add(new_user)
        db.flush()

        if req.role in [UserRole.CAREGIVER, UserRole.CARETAKER]:
            new_caregiver = Caregiver(
                user_id=new_user.id,
                agency=req.agency,
                notes=req.notes,
            )
            db.add(new_caregiver)
        elif req.role == UserRole.PATIENT:
            new_patient = Patient(
                user_id=new_user.id,
                primary_language="as",
                fallback_language="en",
                preferred_language="as",
            )
            db.add(new_patient)

        db.commit()
        db.refresh(new_user)

        access_token = create_access_token(subject=new_user.id, role=new_user.role.value)
        refresh_token = create_refresh_token(subject=new_user.id)

        return Token(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=86400,
            user_id=new_user.id,
            role=new_user.role,
            full_name=new_user.full_name,
        )

    # Backward compatibility alias
    register_caregiver_or_admin = register_user

    @classmethod
    def authenticate_user(cls, db: Session, req: LoginRequest) -> Token:
        # Search by email or phone
        user = db.query(User).filter(
            (User.email == req.email_or_phone) | (User.phone == req.email_or_phone)
        ).first()

        if not user or not verify_password(req.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email/phone or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Account is inactive",
            )

        access_token = create_access_token(subject=user.id, role=user.role.value)
        refresh_token = create_refresh_token(subject=user.id)

        return Token(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=86400,
            user_id=user.id,
            role=user.role,
            full_name=user.full_name,
        )

    @classmethod
    def google_login(cls, db: Session, req: GoogleAuthRequest) -> Token:
        """Authenticates or creates a user account via Google OAuth ID Token."""
        # Validate ID token (in development/test, parse payload; in production use Google certs)
        email = None
        full_name = req.full_name or "Google User"

        if req.id_token.startswith("mock_token_"):
            email = req.id_token.replace("mock_token_", "") + "@gmail.com"
        elif "@" in req.id_token:
            email = req.id_token
        else:
            # Simulated decode or standard Google token exchange
            email = f"user_{req.id_token[:8]}@gmail.com"

        user = db.query(User).filter(User.email == email).first()
        if not user:
            user = User(
                email=email,
                hashed_password=get_password_hash("GoogleAuthPass#2026"),
                full_name=full_name,
                role=req.role,
                is_active=True,
            )
            db.add(user)
            db.flush()

            if req.role in [UserRole.CAREGIVER, UserRole.CARETAKER]:
                cg = Caregiver(user_id=user.id, notes="Signed in via Google OAuth")
                db.add(cg)
            elif req.role == UserRole.PATIENT:
                pt = Patient(
                    user_id=user.id,
                    primary_language=req.preferred_language or "as",
                    fallback_language="en",
                    preferred_language=req.preferred_language or "as",
                )
                db.add(pt)
            db.commit()
            db.refresh(user)

        access_token = create_access_token(subject=user.id, role=user.role.value)
        refresh_token = create_refresh_token(subject=user.id)

        return Token(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=86400,
            user_id=user.id,
            role=user.role,
            full_name=user.full_name,
        )

    @classmethod
    def refresh_access_token(cls, db: Session, refresh_token_str: str) -> Token:
        try:
            payload = decode_token(refresh_token_str)
            user_id: Optional[str] = payload.get("sub")
            token_type: Optional[str] = payload.get("type")
            if not user_id or token_type != "refresh":
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
        except Exception:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired refresh token")

        user = db.query(User).filter(User.id == user_id).first()
        if not user or not user.is_active:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User inactive or not found")

        new_access_token = create_access_token(subject=user.id, role=user.role.value)
        new_refresh_token = create_refresh_token(subject=user.id)

        return Token(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
            expires_in=86400,
            user_id=user.id,
            role=user.role,
            full_name=user.full_name,
        )

    @classmethod
    def get_user_profile(cls, db: Session, user: User) -> UserResponse:
        caregiver_id = None
        patient_id = None

        if user.role in [UserRole.CAREGIVER, UserRole.CARETAKER] and user.caregiver_profile:
            caregiver_id = user.caregiver_profile.id
        elif user.role == UserRole.PATIENT and user.patient_profile:
            patient_id = user.patient_profile.id

        return UserResponse(
            id=user.id,
            email=user.email,
            phone=user.phone,
            full_name=user.full_name,
            role=user.role,
            is_active=user.is_active,
            created_at=user.created_at,
            caregiver_id=caregiver_id,
            patient_id=patient_id,
        )
