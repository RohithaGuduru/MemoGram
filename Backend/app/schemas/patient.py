from datetime import date, datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict


class AccessibilityPreferences(BaseModel):
    high_contrast: bool = False
    screen_reader_friendly: bool = True
    haptic_feedback: bool = True
    audio_cues: bool = True
    simplified_ui: bool = True
    touch_target_size: str = "large"  # 'medium', 'large', 'extra_large'


class PatientCreate(BaseModel):
    full_name: str = Field(..., min_length=2)
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    password: Optional[str] = Field(default="Patient@123", min_length=6)
    date_of_birth: Optional[date] = None
    preferred_language: str = Field(default="en", description="e.g. en, hi, as, bn")
    font_size: str = Field(default="large", description="'medium', 'large', 'extra_large'")
    timezone: str = Field(default="Asia/Kolkata")
    voice_preference: str = Field(default="female_calm")
    interests: List[str] = Field(default_factory=list)
    accessibility_preferences: Optional[Dict[str, Any]] = None


class PatientUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    preferred_language: Optional[str] = None
    font_size: Optional[str] = None
    timezone: Optional[str] = None
    voice_preference: Optional[str] = None
    interests: Optional[List[str]] = None
    accessibility_preferences: Optional[Dict[str, Any]] = None


class PatientResponse(BaseModel):
    id: str
    user_id: str
    full_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    preferred_language: str
    font_size: str
    timezone: str
    voice_preference: str
    interests: List[str]
    accessibility_preferences: Dict[str, Any]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PatientDetailResponse(PatientResponse):
    primary_caregiver_name: Optional[str] = None
    family_members_count: int = 0
    active_medications_count: int = 0
    active_reminders_count: int = 0
    completed_games_count: int = 0

    model_config = ConfigDict(from_attributes=True)
