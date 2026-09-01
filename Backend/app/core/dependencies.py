from typing import Generator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import decode_token
from app.db.session import get_db
from app.models.user import User
from app.models.caregiver import Caregiver
from app.models.patient import Patient
from app.models.relationship import PatientCaretakerRelationship
from app.utils.enums import UserRole, RelationshipStatus

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login"
)


def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme),
) -> User:
    """Extracts and verifies the authenticated user from the JWT Bearer token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_token(token)
        user_id: Optional[str] = payload.get("sub")
        token_type: Optional[str] = payload.get("type")
        if user_id is None or token_type != "access":
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account",
        )
    return user


def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    return current_user


def require_caregiver(
    current_user: User = Depends(get_current_user),
) -> User:
    """Ensures current user is a Caretaker/Caregiver or Admin."""
    if current_user.role not in [UserRole.CAREGIVER, UserRole.CARETAKER, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Requires Caretaker role",
        )
    return current_user


require_caretaker = require_caregiver


def require_patient(
    current_user: User = Depends(get_current_user),
) -> User:
    """Ensures current user is a Patient."""
    if current_user.role != UserRole.PATIENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Requires Patient role",
        )
    return current_user


def require_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    """Ensures current user is an Admin."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Requires Admin role",
        )
    return current_user


def verify_patient_access(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Patient:
    """
    Strict authorization check:
    1. Admin has access to all patients.
    2. Patient can only access their own patient profile.
    3. Caretaker can only access patients with an ACTIVE relationship.
    """
    patient = db.query(Patient).filter(Patient.id == id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found",
        )

    if current_user.role == UserRole.ADMIN:
        return patient

    if current_user.role == UserRole.PATIENT:
        if patient.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Unauthorized: Patients can only access their own data",
            )
        return patient

    if current_user.role in [UserRole.CAREGIVER, UserRole.CARETAKER]:
        caregiver = db.query(Caregiver).filter(Caregiver.user_id == current_user.id).first()
        if not caregiver:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Caretaker profile not found",
            )
        # Check active caregiver-patient relationship
        rel = db.query(PatientCaretakerRelationship).filter(
            PatientCaretakerRelationship.caregiver_id == caregiver.id,
            PatientCaretakerRelationship.patient_id == patient.id,
            PatientCaretakerRelationship.status == RelationshipStatus.ACTIVE,
        ).first()
        if not rel:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Unauthorized: Caretaker is not assigned or does not have an active authorized relationship with this patient",
            )
        return patient

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Unauthorized patient access",
    )
