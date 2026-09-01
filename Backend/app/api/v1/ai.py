from typing import Optional
from fastapi import APIRouter, Depends, WebSocket, status, Query, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.ai import (
    AIStatusResponse,
    VoiceSessionCreateRequest,
    VoiceSessionResponse,
    VoiceTokenRequest,
    VoiceTokenResponse,
    AIChatRequest,
    AIChatResponse,
    AIInsightGenerateRequest,
    AIInsightResponse,
)
from app.services.gemini_service import GeminiService
from app.services.voice_assistant_service import VoiceAssistantService
from app.services.ai_insights_service import AIInsightsService
from app.core.dependencies import verify_patient_access, get_current_user
from app.models.user import User
from app.models.patient import Patient

router = APIRouter(prefix="/ai", tags=["Gemini AI"])


# -----------------------------------------------------------------------------
# 1. AI Service Health & Status
# -----------------------------------------------------------------------------
@router.get("/status", response_model=AIStatusResponse)
def get_ai_service_status():
    """
    Returns Gemini AI service availability, supported capabilities,
    active model configuration, and language options.
    """
    status_info = GeminiService.check_availability()
    return AIStatusResponse(**status_info)


# -----------------------------------------------------------------------------
# 2. Voice Session Authorization & Creation
# -----------------------------------------------------------------------------
@router.post("/voice/session", response_model=VoiceSessionResponse)
def create_voice_session(
    req: VoiceSessionCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Authorizes and initializes a Gemini Live voice session for an elderly patient.
    Returns ephemeral session token and WebSocket connection URL.
    Never exposes GEMINI_API_KEY.
    """
    # Verify user has access to patient
    verify_patient_access(id=req.patient_id, current_user=current_user, db=db)

    return VoiceAssistantService.create_voice_session(
        db=db,
        patient_id=req.patient_id,
        preferred_language=req.preferred_language,
        voice_name=req.voice_name,
    )


# -----------------------------------------------------------------------------
# 3. Voice Ephemeral Token
# -----------------------------------------------------------------------------
@router.post("/voice/token", response_model=VoiceTokenResponse)
def get_voice_session_token(
    req: VoiceTokenRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns a client-safe, short-lived session token for Live API handshake.
    Strictly safeguards backend API keys.
    """
    verify_patient_access(id=req.patient_id, current_user=current_user, db=db)

    token_info = GeminiService.create_ephemeral_token(
        patient_id=req.patient_id,
        session_id=req.session_id,
    )
    return VoiceTokenResponse(**token_info)


# -----------------------------------------------------------------------------
# 4. Live Voice Streaming WebSocket
# -----------------------------------------------------------------------------
@router.websocket("/voice/ws/{session_id}")
async def voice_streaming_websocket(
    websocket: WebSocket,
    session_id: str,
    db: Session = Depends(get_db),
):
    """
    Stateful real-time bidirectional WebSocket connection for Gemini Live voice assistant.
    Supports audio/text input, spoken replies, interruption (barge-in), and backend tool calling.
    """
    await VoiceAssistantService.handle_live_websocket(
        websocket=websocket,
        session_id=session_id,
        db=db,
    )


# -----------------------------------------------------------------------------
# 5. Conversational Text Assistant (Fallback & Multi-Modal)
# -----------------------------------------------------------------------------
@router.post("/chat", response_model=AIChatResponse)
def chat_with_assistant(
    req: AIChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Conversational AI assistant with backend database tool calling.
    Enforces elderly-friendly communication rules and executes database tools securely.
    """
    patient = verify_patient_access(id=req.patient_id, current_user=current_user, db=db)

    lang = req.language or patient.preferred_language
    sys_instruction = VoiceAssistantService.get_system_instruction(
        preferred_language=lang,
        patient_name=patient.user.full_name if patient.user else None,
    )

    history_dicts = [m.model_dump() for m in req.conversation_history] if req.conversation_history else []

    result = GeminiService.generate_chat_response(
        patient_id=patient.id,
        message=req.message,
        system_instruction=sys_instruction,
        conversation_history=history_dicts,
        db=db,
        language=lang,
    )

    return AIChatResponse(
        reply=result["reply"],
        language=result["language"],
        tool_calls_executed=result.get("tool_calls_executed", []),
        available=result.get("available", True),
        model=result.get("model", "mind_ease_ai"),
    )


# -----------------------------------------------------------------------------
# 6. Caregiver AI Insights: Generate Fresh
# -----------------------------------------------------------------------------
@router.post("/insights/{patient_id}", response_model=AIInsightResponse)
def generate_patient_ai_insights(
    patient_id: str,
    req: Optional[AIInsightGenerateRequest] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Generates fresh structured AI insights for caregivers based on telemetry
    from the metrics, baseline, and trend engines.
    """
    verify_patient_access(id=patient_id, current_user=current_user, db=db)

    force_refresh = req.force_refresh if req else True
    timeframe = req.timeframe if req else "week"

    return AIInsightsService.generate_patient_insights(
        db=db,
        patient_id=patient_id,
        force_refresh=force_refresh,
        timeframe=timeframe,
    )


# -----------------------------------------------------------------------------
# 7. Caregiver AI Insights: Retrieve Latest
# -----------------------------------------------------------------------------
@router.get("/insights/{patient_id}", response_model=AIInsightResponse)
def get_latest_patient_ai_insights(
    patient_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieves the most recent stored AI insight for the patient,
    or generates an initial one if none exists.
    """
    verify_patient_access(id=patient_id, current_user=current_user, db=db)

    insight = AIInsightsService.get_latest_insight(db=db, patient_id=patient_id)
    if not insight:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No AI insights could be generated for this patient.",
        )
    return insight
