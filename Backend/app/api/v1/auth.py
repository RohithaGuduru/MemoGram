from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    RefreshTokenRequest,
    Token,
    UserResponse,
)
from app.schemas.memogram import GoogleAuthRequest, LogoutResponse
from app.services.auth_service import AuthService
from app.core.dependencies import get_current_active_user
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(
    req: RegisterRequest,
    db: Session = Depends(get_db),
):
    """Registers a new Caretaker, Patient, or Admin user account and returns JWT credentials."""
    return AuthService.register_user(db, req)


@router.post("/login", response_model=Token)
def login(
    req: LoginRequest,
    db: Session = Depends(get_db),
):
    """Authenticates credentials (email/phone + password) and issues JWT access & refresh tokens."""
    return AuthService.authenticate_user(db, req)


@router.post("/google", response_model=Token)
def google_auth(
    req: GoogleAuthRequest,
    db: Session = Depends(get_db),
):
    """Authenticates or signs up Patient or Caretaker via Google OAuth."""
    return AuthService.google_login(db, req)


@router.post("/refresh", response_model=Token)
def refresh_token(
    req: RefreshTokenRequest,
    db: Session = Depends(get_db),
):
    """Exchanges a valid refresh token for a newly signed access token."""
    return AuthService.refresh_access_token(db, req.refresh_token)


@router.post("/logout", response_model=LogoutResponse)
def logout(
    current_user: User = Depends(get_current_active_user),
):
    """Logs out the current session and invalidates client credentials."""
    return LogoutResponse(success=True, message=f"User {current_user.full_name} successfully logged out.")


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Retrieves profile information and role context for the authenticated user."""
    return AuthService.get_user_profile(db, current_user)
