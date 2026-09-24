from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict

from app.utils.enums import UserRole


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user_id: str
    role: UserRole
    full_name: str


class TokenPayload(BaseModel):
    sub: str
    role: UserRole
    type: str
    exp: int


class LoginRequest(BaseModel):
    email_or_phone: str = Field(..., description="Email or phone number")
    password: str = Field(..., min_length=4)


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class RegisterRequest(BaseModel):
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    password: str = Field(..., min_length=6)
    full_name: str = Field(..., min_length=2)
    role: UserRole = Field(default=UserRole.CAREGIVER)
    agency: Optional[str] = None
    notes: Optional[str] = None


class UserResponse(BaseModel):
    id: str
    email: Optional[str] = None
    phone: Optional[str] = None
    full_name: str
    role: UserRole
    is_active: bool
    created_at: datetime
    caregiver_id: Optional[str] = None
    patient_id: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    password: Optional[str] = None


class ForgotPasswordRequest(BaseModel):
    email: EmailStr = Field(..., description="Registered account email address")


class ForgotPasswordResponse(BaseModel):
    message: str = Field(default="If an account exists for this email, a reset code has been sent.")


class ResetPasswordRequest(BaseModel):
    email: EmailStr = Field(..., description="Registered account email address")
    otp: str = Field(..., min_length=6, max_length=6, description="6-digit reset code")
    new_password: str = Field(..., min_length=6, description="New secure password")


class ResetPasswordResponse(BaseModel):
    message: str = Field(default="Password reset successful.")

