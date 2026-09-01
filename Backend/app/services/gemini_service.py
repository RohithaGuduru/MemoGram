import json
import time
from datetime import timedelta
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.logging import get_logger
from app.core.security import create_access_token
from app.services.ai_tools_service import AIToolsService

logger = get_logger("app.services.gemini_service")

# Try importing the official Google GenAI SDK
try:
    from google import genai
    from google.genai import types
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False
    genai = None
    types = None


class GeminiService:
    """
    Centralized communication and integration service for Google Gemini AI.
    Implements Google GenAI SDK client, Gemini Live session management,
    function calling tool execution, and structured generation.
    """

    _client: Optional[Any] = None

    @classmethod
    def get_client(cls) -> Optional[Any]:
        """Initializes and returns the official Google GenAI client if API key is present."""
        if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY.strip() == "":
            return None

        if not GENAI_AVAILABLE:
            logger.warning("google-genai SDK package is not installed. Gemini live calls disabled.")
            return None

        if cls._client is None:
            try:
                cls._client = genai.Client(api_key=settings.GEMINI_API_KEY)
                logger.info("Initialized Google GenAI client successfully.")
            except Exception as e:
                logger.error(f"Failed to initialize Google GenAI client: {str(e)}")
                return None

        return cls._client

    @classmethod
    def is_available(cls) -> bool:
        """Returns True if Gemini client is initialized and configured."""
        return cls.get_client() is not None

    @classmethod
    def check_availability(cls) -> Dict[str, Any]:
        """Returns the operational status and capability matrix of Gemini AI."""
        has_key = bool(settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip() != "")
        
        if not has_key:
            return {
                "available": False,
                "status": "api_key_missing",
                "model": settings.GEMINI_MODEL,
                "voice_model": settings.GEMINI_VOICE_MODEL,
                "voice_enabled": False,
                "supported_languages": ["en", "hi", "as", "bn", "mni"],
                "message": "Gemini API key is not configured. Running in offline / deterministic mode.",
            }

        if not GENAI_AVAILABLE:
            return {
                "available": False,
                "status": "sdk_unavailable",
                "model": settings.GEMINI_MODEL,
                "voice_model": settings.GEMINI_VOICE_MODEL,
                "voice_enabled": False,
                "supported_languages": ["en", "hi", "as", "bn", "mni"],
                "message": "google-genai SDK package is not installed. Running in deterministic fallback mode.",
            }

        return {
            "available": True,
            "status": "operational",
            "model": settings.GEMINI_MODEL,
            "voice_model": settings.GEMINI_VOICE_MODEL,
            "voice_enabled": True,
            "supported_languages": ["en", "hi", "as", "bn", "mni"],
            "message": "Gemini AI services and Live Voice assistant are operational.",
        }

    # -------------------------------------------------------------------------
    # Ephemeral Client Credentials
    # -------------------------------------------------------------------------
    @classmethod
    def create_ephemeral_token(cls, patient_id: str, session_id: str) -> Dict[str, Any]:
        """
        Creates a client-safe, short-lived session token for Flutter client voice connection.
        Never returns GEMINI_API_KEY to the client.
        """
        token = create_access_token(
            subject=patient_id,
            role="patient",
            expires_delta=timedelta(seconds=3600),
            extra_claims={"session_id": session_id, "scope": "live_voice"},
        )
        return {
            "token": token,
            "token_type": "Bearer",
            "expires_in": 3600,
            "model": settings.GEMINI_VOICE_MODEL,
        }

    # -------------------------------------------------------------------------
    # Conversational Chat with Function Calling
    # -------------------------------------------------------------------------
    @classmethod
    def generate_chat_response(
        cls,
        patient_id: str,
        message: str,
        system_instruction: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        db: Optional[Session] = None,
        language: str = "en",
    ) -> Dict[str, Any]:
        """
        Generates conversational response using Gemini with backend function calling.
        If Gemini is unavailable or key is missing, falls back to deterministic assistance.
        """
        start_time = time.time()
        client = cls.get_client()
        executed_tools: List[str] = []

        if client is None:
            # Deterministic conversational fallback
            logger.info("Gemini client unavailable, using fallback assistant.")
            fallback_reply = cls._generate_fallback_chat(db, patient_id, message, language, executed_tools)
            latency = round(time.time() - start_time, 3)
            return {
                "reply": fallback_reply,
                "language": language,
                "tool_calls_executed": executed_tools,
                "available": False,
                "model": "mind_ease_deterministic_v1",
                "latency_sec": latency,
            }

        try:
            # Build conversation turns
            contents = []
            if conversation_history:
                for msg in conversation_history:
                    role = "user" if msg.get("role") == "user" else "model"
                    contents.append(types.Content(
                        role=role,
                        parts=[types.Part.from_text(text=msg.get("content", ""))]
                    ))

            contents.append(types.Content(
                role="user",
                parts=[types.Part.from_text(text=message)]
            ))

            # Prepare tool definitions
            tool_declarations = AIToolsService.get_tool_declarations()
            function_declarations = []
            for td in tool_declarations:
                function_declarations.append(types.FunctionDeclaration(
                    name=td["name"],
                    description=td["description"],
                    parameters=td["parameters"],
                ))

            tools = [types.Tool(function_declarations=function_declarations)] if function_declarations else None

            config = types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.4,
                tools=tools,
            )

            # First turn to Gemini
            response = client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=contents,
                config=config,
            )

            # Handle function call loop
            max_turns = 3
            current_turn = 0
            while response.function_calls and current_turn < max_turns and db is not None:
                current_turn += 1
                tool_call = response.function_calls[0]
                tool_name = tool_call.name
                tool_args = tool_call.args or {}
                executed_tools.append(tool_name)

                logger.info(f"Gemini invoked tool: {tool_name} for patient: {patient_id}")
                tool_result = AIToolsService.execute_tool(
                    tool_name=tool_name,
                    arguments=tool_args,
                    db=db,
                    patient_id=patient_id,
                )

                # Send tool response back to Gemini
                contents.append(response.candidates[0].content)
                contents.append(types.Content(
                    role="user",
                    parts=[types.Part.from_function_response(
                        name=tool_name,
                        response={"result": tool_result}
                    )]
                ))

                response = client.models.generate_content(
                    model=settings.GEMINI_MODEL,
                    contents=contents,
                    config=config,
                )

            reply_text = response.text or "I am here with you. How can I help you today?"
            latency = round(time.time() - start_time, 3)
            logger.info(f"Gemini chat response generated in {latency}s with model {settings.GEMINI_MODEL}")

            return {
                "reply": reply_text,
                "language": language,
                "tool_calls_executed": executed_tools,
                "available": True,
                "model": settings.GEMINI_MODEL,
                "latency_sec": latency,
            }

        except Exception as exc:
            logger.error(f"Gemini API chat error: {str(exc)}", exc_info=True)
            fallback_reply = cls._generate_fallback_chat(db, patient_id, message, language, executed_tools)
            latency = round(time.time() - start_time, 3)
            return {
                "reply": fallback_reply,
                "language": language,
                "tool_calls_executed": executed_tools,
                "available": False,
                "model": "mind_ease_fallback_v1",
                "latency_sec": latency,
            }

    # -------------------------------------------------------------------------
    # Structured Generation for Caregiver Insights
    # -------------------------------------------------------------------------
    @classmethod
    def generate_structured_json(
        cls,
        prompt: str,
        system_instruction: str,
    ) -> Optional[Dict[str, Any]]:
        """
        Calls Gemini to generate structured JSON conforming to the caregiver insight schema.
        Returns parsed JSON dict or None on failure.
        """
        client = cls.get_client()
        if client is None:
            return None

        start_time = time.time()
        try:
            config = types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.2,
                response_mime_type="application/json",
            )
            response = client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=prompt,
                config=config,
            )

            latency = round(time.time() - start_time, 3)
            logger.info(f"Gemini structured insight generated in {latency}s with model {settings.GEMINI_MODEL}")

            raw_text = response.text.strip()
            # Clean markdown wrappers if present
            if raw_text.startswith("```json"):
                raw_text = raw_text[7:]
            if raw_text.startswith("```"):
                raw_text = raw_text[3:]
            if raw_text.endswith("```"):
                raw_text = raw_text[:-3]

            return json.loads(raw_text.strip())

        except Exception as exc:
            logger.error(f"Gemini structured JSON generation failed: {str(exc)}", exc_info=True)
            return None

    # -------------------------------------------------------------------------
    # Fallback Deterministic Assistant
    # -------------------------------------------------------------------------
    @classmethod
    def _generate_fallback_chat(
        cls,
        db: Optional[Session],
        patient_id: str,
        message: str,
        language: str,
        executed_tools: List[str],
    ) -> str:
        """
        Reliable offline / fallback response generator when Gemini is not connected.
        Executes tools deterministically based on keyword intent.
        """
        msg_lower = message.lower()

        # 1. Medicine / Reminder query
        if any(w in msg_lower for w in ["medicine", "pill", "medication", "dose", "tablet", "dawaii", "dawa"]):
            if db:
                executed_tools.append("get_medication_schedule")
                meds = AIToolsService.get_medication_schedule(db, patient_id)
                active_meds = meds.get("medications", [])
                if active_meds:
                    med_names = ", ".join(m["name"] + f" ({m['time_of_day']})" for m in active_meds[:3])
                    if language == "hi":
                        return f"आपकी आज की दवाइयों में {med_names} शामिल हैं।"
                    elif language == "as":
                        return f"আপোনাৰ আজিৰ ঔষধসমূহৰ ভিতৰত {med_names} আছে।"
                    return f"Your scheduled medications include: {med_names}. Please take them with water as advised."
            return "Please check your daily schedule for your medication times."

        # 2. Activity / Next Game query
        if any(w in msg_lower for w in ["game", "activity", "play", "start", "exercise", "khel"]):
            if db:
                executed_tools.append("get_next_recommended_game")
                rec = AIToolsService.get_next_recommended_game(db, patient_id)
                if "game_name" in rec:
                    name = rec["game_name"]
                    diff = rec["target_difficulty"]
                    if language == "hi":
                        return f"आपके लिए अगला गतिविधि खेल '{name}' (स्तर {diff}) है। क्या आप इसे शुरू करना चाहेंगे?"
                    elif language == "as":
                        return f"আপোনাৰ বাবে পৰৱৰ্তী কাৰ্যকলাপ হৈছে '{name}' (স্তৰ {diff})। আপুনি আৰম্ভ কৰিব নেকি?"
                    return f"You have a recommended activity: '{name}' at level {diff}. Would you like to start?"
            return "You have pleasant cognitive activities prepared for you. Tap the play button whenever you are ready."

        # 3. Schedule / Reminders query
        if any(w in msg_lower for w in ["reminder", "schedule", "routine", "next", "now", "kya karu"]):
            if db:
                executed_tools.append("get_upcoming_reminders")
                rem = AIToolsService.get_upcoming_reminders(db, patient_id)
                next_rem = rem.get("next_upcoming_reminder")
                if next_rem:
                    title = next_rem["title"]
                    t = next_rem["scheduled_time"]
                    if language == "hi":
                        return f"आपका अगला रिमाइंडर '{title}' {t} बजे निर्धारित है।"
                    elif language == "as":
                        return f"আপোনাৰ পৰৱৰ্তী সোঁৱৰণি '{title}' {t} বজাত আছে।"
                    return f"Your next reminder is '{title}' scheduled for {t}."

        # Generic friendly fallback
        if language == "hi":
            return "नमस्ते! मैं माइंडीज सहायक हूँ। आप अपनी गतिविधियों, दवाइयों या दिनचर्या के बारे में मुझसे पूछ सकते हैं।"
        elif language == "as":
            return "নমস্কাৰ! মই মাইণ্ডইজ সহায়ক। আপোনাৰ কাৰ্যকলাপ বা ঔষধৰ বিষয়ে মোক সুধিব পাৰে।"
        return "Hello! I am MindEase. You can ask me about your daily activities, upcoming reminders, or medicine schedule."
