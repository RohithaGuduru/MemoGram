import uuid
from typing import Any, Dict, Optional
from fastapi import WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.logging import get_logger
from app.core.security import decode_token
from app.models.patient import Patient
from app.schemas.ai import VoiceSessionResponse
from app.services.gemini_service import GeminiService
from app.services.ai_tools_service import AIToolsService

logger = get_logger("app.services.voice_assistant_service")


class VoiceAssistantService:
    """
    Voice Assistant Service for MindEase Elderly Patient Interaction.
    Configures elderly-friendly system instructions, multilingual prompts,
    and manages Gemini Live WebSocket streaming sessions.
    """

    # Supported language prompt localizations
    LANGUAGE_NAMES = {
        "en": "English",
        "hi": "Hindi (हिन्दी)",
        "as": "Assamese (অসমীয়া)",
        "bn": "Bengali (বাংলা)",
        "mni": "Manipuri (মৈতৈলোন্)",
    }

    @classmethod
    def get_system_instruction(cls, preferred_language: str = "en", patient_name: Optional[str] = None) -> str:
        """
        Builds the strict, non-diagnostic, compassionate system instruction for the voice assistant.
        """
        lang_name = cls.LANGUAGE_NAMES.get(preferred_language, "English")
        name_clause = f"The patient you are speaking with is named {patient_name}." if patient_name else "You are speaking with an elderly patient."

        return f"""
You are MindEase, a warm, patient, and compassionate voice companion designed for elderly individuals.
{name_clause}

COMMUNICATION STYLE & TONE:
1. Speak slowly, clearly, warmly, and calmly.
2. Use short, simple sentences (1-2 sentences per thought).
3. Be reassuring, encouraging, and respectful.
4. Always respond in {lang_name} ({preferred_language}).
5. Avoid complicated medical or technical terminology.

STRICT MEDICAL & SAFETY RULES (NEVER VIOLATE):
1. You are NOT a medical doctor. NEVER diagnose dementia, cognitive decline, or any medical condition.
2. NEVER say statements like "your dementia is worsening", "your memory is improving medically", or "you have cognitive decline".
3. NEVER invent or hallucinate medication names, dosages, schedules, or doctor appointments.
4. Whenever the user asks about their medicines, activities, reminders, doctor visits, or performance, ALWAYS call the provided backend function tools first before responding.
5. If asked for medical advice or diagnosis, gently advise: "For personal medical advice, please speak with your doctor or caregiver."

TOOL USAGE PROTOCOL:
- If the patient asks "What should I do now?" or "What game should I play?", call 'get_next_recommended_game' or 'get_today_activity'.
- If the patient asks "When is my next medicine?" or "What pills do I take?", call 'get_upcoming_reminders' and 'get_medication_schedule'.
- If the patient asks "When is my doctor appointment?", call 'get_next_appointment'.
- If the patient asks "How did I do today?", call 'get_recent_performance'.
- If the patient asks about family contacts, call 'get_family_members'.

Remember: You are a friendly, supportive companion helping the patient stay engaged and on routine.
"""

    @classmethod
    def create_voice_session(
        cls,
        db: Session,
        patient_id: str,
        preferred_language: Optional[str] = None,
        voice_name: Optional[str] = None,
    ) -> VoiceSessionResponse:
        """
        Creates and authorizes a new voice session for a patient.
        Returns short-lived ephemeral credential and WebSocket connection details.
        Never exposes GEMINI_API_KEY.
        """
        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        patient_name = patient.user.full_name if (patient and patient.user) else None
        resolved_lang = preferred_language or (patient.preferred_language if patient else "en")

        session_id = f"voice_sess_{uuid.uuid4().hex[:16]}"
        ephemeral = GeminiService.create_ephemeral_token(patient_id=patient_id, session_id=session_id)
        sys_instruction = cls.get_system_instruction(preferred_language=resolved_lang, patient_name=patient_name)

        ws_url = f"/api/v1/ai/voice/ws/{session_id}"

        return VoiceSessionResponse(
            session_id=session_id,
            patient_id=patient_id,
            websocket_url=ws_url,
            ephemeral_token=ephemeral["token"],
            expires_in=ephemeral["expires_in"],
            language=resolved_lang,
            model=settings.GEMINI_VOICE_MODEL,
            system_instruction=sys_instruction,
        )

    # -------------------------------------------------------------------------
    # WebSocket Live Session Handler
    # -------------------------------------------------------------------------
    @classmethod
    async def handle_live_websocket(cls, websocket: WebSocket, session_id: str, db: Session):
        """
        Handles bidirectional real-time audio/text WebSocket connection with Flutter.
        Coordinates with Gemini Live and handles tool calling seamlessly.
        """
        await websocket.accept()
        logger.info(f"Voice WebSocket connected for session: {session_id}")

        patient_id = None
        language = "en"

        try:
            # 1. Handshake frame: Expect auth token / initialization from client
            init_data = await websocket.receive_json()
            token = init_data.get("token")

            if not token:
                await websocket.send_json({"type": "error", "message": "Authentication token required."})
                await websocket.close(code=1008)
                return

            try:
                payload = decode_token(token)
                patient_id = payload.get("sub")
            except Exception:
                await websocket.send_json({"type": "error", "message": "Invalid or expired session token."})
                await websocket.close(code=1008)
                return

            patient = db.query(Patient).filter(Patient.id == patient_id).first()
            if patient:
                language = patient.preferred_language

            # Send session ready confirmation
            await websocket.send_json({
                "type": "session_started",
                "session_id": session_id,
                "status": "ready",
                "language": language,
                "model": settings.GEMINI_VOICE_MODEL,
            })

            # 2. Main message streaming loop
            while True:
                msg = await websocket.receive_json()
                msg_type = msg.get("type", "text")

                # Support Interruption / Barge-In
                if msg_type == "interrupt" or msg_type == "stop":
                    logger.info(f"Voice session {session_id} received user interruption.")
                    await websocket.send_json({"type": "interrupted", "status": "speech_halted"})
                    continue

                # Text transcript or Audio chunk processing
                if msg_type in ["text", "transcript", "audio"]:
                    user_text = msg.get("content") or msg.get("text", "")
                    sys_instruction = cls.get_system_instruction(
                        preferred_language=language,
                        patient_name=patient.user.full_name if (patient and patient.user) else None,
                    )

                    await websocket.send_json({"type": "speaking_started"})

                    # Generate response with tool calling support
                    ai_res = GeminiService.generate_chat_response(
                        patient_id=patient_id,
                        message=user_text,
                        system_instruction=sys_instruction,
                        conversation_history=msg.get("history", []),
                        db=db,
                        language=language,
                    )

                    # Stream text chunk / audio state back to client
                    await websocket.send_json({
                        "type": "response",
                        "reply": ai_res["reply"],
                        "language": ai_res["language"],
                        "tool_calls": ai_res["tool_calls_executed"],
                        "available": ai_res["available"],
                    })

                    await websocket.send_json({"type": "speaking_ended"})

        except WebSocketDisconnect:
            logger.info(f"Voice WebSocket disconnected gracefully for session {session_id}")
        except Exception as e:
            logger.error(f"Voice WebSocket error in session {session_id}: {str(e)}", exc_info=True)
            try:
                await websocket.send_json({"type": "error", "message": "Voice processing encountered a temporary error."})
            except Exception:
                pass
