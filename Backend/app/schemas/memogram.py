from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

from app.utils.enums import (
    UserRole,
    RelationshipStatus,
    LanguageCapabilityStatus,
    MedicationActionType,
    SOSStatus,
    VoiceIntent,
)


# =============================================================================
# Auth Schemas
# =============================================================================
class GoogleAuthRequest(BaseModel):
    id_token: str
    role: UserRole = UserRole.PATIENT
    full_name: Optional[str] = None
    preferred_language: Optional[str] = "as"


class LogoutResponse(BaseModel):
    success: bool = True
    message: str = "Successfully logged out."


# =============================================================================
# Relationship & OTP Schemas
# =============================================================================
class RelationshipInviteRequest(BaseModel):
    patient_email_or_phone: str
    relation_type: str = "primary_caretaker"


class RelationshipInviteResponse(BaseModel):
    relationship_id: str
    patient_id: str
    patient_name: str
    caretaker_id: str
    status: RelationshipStatus
    expires_in_minutes: int
    created_at: datetime
    test_otp_code: Optional[str] = None  # Included in dev/test environment for automated verification


class RelationshipVerifyOTPRequest(BaseModel):
    relationship_id: str
    otp_code: str


class RelationshipResponse(BaseModel):
    id: str
    patient_id: str
    caretaker_id: str
    patient_name: Optional[str] = None
    patient_email: Optional[str] = None
    caretaker_name: Optional[str] = None
    relation_type: str
    status: RelationshipStatus
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# Language Capability Schemas
# =============================================================================
class CapabilityProviderInfo(BaseModel):
    available: bool
    provider: str


class LanguageCapabilityDetail(BaseModel):
    stt: CapabilityProviderInfo
    translation: CapabilityProviderInfo
    tts: CapabilityProviderInfo


class LanguageCapabilityResponse(BaseModel):
    language_code: str
    display_name: str
    native_name: str
    script: str
    text_available: bool
    ui_text_available: bool
    capabilities: LanguageCapabilityDetail
    status: str
    enabled: bool

    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# Voice API Schemas
# =============================================================================
class VoiceProcessRequest(BaseModel):
    patient_id: str
    language: str = "as"
    audio_base64: Optional[str] = None
    transcript_text: Optional[str] = None
    session_context: Optional[Dict[str, Any]] = None


class VoiceProcessResponse(BaseModel):
    recognized_text: str
    intent: VoiceIntent
    reply_text: str
    audio_base64: Optional[str] = None
    audio_url: Optional[str] = None
    language: str
    tts_available: bool
    tts_status: str
    tts_message: Optional[str] = None
    tool_executed: Optional[str] = None
    data: Optional[Dict[str, Any]] = None


# =============================================================================
# SOS & Notification Schemas
# =============================================================================
class SOSRequest(BaseModel):
    patient_id: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    message: Optional[str] = "Emergency SOS assistance requested by patient."


class SOSResponse(BaseModel):
    id: str
    patient_id: str
    patient_name: str
    status: SOSStatus
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    message: str
    triggered_at: datetime
    resolved_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class NotificationResponse(BaseModel):
    id: str
    user_id: str
    title: str
    body: str
    notification_type: str
    is_read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# Medication Action Schemas
# =============================================================================
class MedicationActionRequest(BaseModel):
    action: MedicationActionType
    scheduled_for: Optional[datetime] = None
    notes: Optional[str] = None


class MedicationActionResponse(BaseModel):
    medication_id: str
    medication_name: str
    action_recorded: MedicationActionType
    recorded_at: datetime
    status: str
    message: str


# =============================================================================
# Game Content AI Schemas (Gemini Layer)
# =============================================================================
class GameContentGenerateRequest(BaseModel):
    game_code: str
    difficulty: int = 1
    theme: Optional[str] = "regional_heritage"
    language: str = "as"


class GameContentGenerateResponse(BaseModel):
    game_code: str
    difficulty: int
    language: str
    title: str
    instructions: str
    items: List[Dict[str, Any]]
    cultural_context: Optional[str] = None
