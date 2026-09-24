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
        supported_langs = ["as", "brx", "mni", "kokborok", "mizo", "kha", "hi", "en"]
        
        if not has_key:
            return {
                "available": False,
                "status": "api_key_missing",
                "model": settings.GEMINI_MODEL,
                "voice_model": settings.GEMINI_VOICE_MODEL,
                "voice_enabled": False,
                "supported_languages": supported_langs,
                "message": "Gemini API key is not configured. Running in offline / deterministic mode.",
            }

        if not GENAI_AVAILABLE:
            return {
                "available": False,
                "status": "sdk_unavailable",
                "model": settings.GEMINI_MODEL,
                "voice_model": settings.GEMINI_VOICE_MODEL,
                "voice_enabled": False,
                "supported_languages": supported_langs,
                "message": "google-genai SDK package is not installed. Running in deterministic fallback mode.",
            }

        return {
            "available": True,
            "status": "operational",
            "model": settings.GEMINI_MODEL,
            "voice_model": settings.GEMINI_VOICE_MODEL,
            "voice_enabled": True,
            "supported_languages": supported_langs,
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
    # Voice Instructions Builder
    # -------------------------------------------------------------------------
    @classmethod
    def build_voice_system_instruction(cls, language: str = "en") -> str:
        """
        Builds elderly-friendly voice assistant system instructions enforcing
        strict language adherence, conversational warmth, and medical safety.
        """
        norm_lang = language.lower().split("-")[0]
        language_names = {
            "as": "Assamese",
            "brx": "Bodo",
            "mni": "Manipuri / Meitei",
            "kokborok": "Kokborok",
            "trp": "Kokborok",
            "mizo": "Mizo",
            "lus": "Mizo",
            "kha": "Khasi",
            "khasi": "Khasi",
            "hi": "Hindi",
            "en": "English (India)",
        }
        lang_name = language_names.get(norm_lang, "English (India)")

        return f"""You are Memogram, a caring, gentle, and respectful AI cognitive wellness and medication companion for senior citizens.

CRITICAL VOICE & LANGUAGE INSTRUCTIONS:
1. The patient's selected language is: {lang_name} (language code: {language}).
2. ALWAYS understand the patient's selected language, whether spoken in native script, transliteration, or colloquial phrasing.
3. ALWAYS generate your response entirely in {lang_name} ({language}).
4. NEVER translate or switch the response into English or Hindi unless {lang_name} is explicitly English or Hindi.
5. Keep your spoken responses short (1-2 sentences), comforting, and simple for an elderly listener to follow.
6. Speak with warmth, dignity, and patience. Avoid technical, clinical, or formal medical jargon.
7. Medical safety: You are a wellness companion, NOT a diagnostic clinician. Never provide diagnoses, never alter medication dosages. Always recommend consulting a doctor or family caregiver for medical concerns.
8. If the senior asks about medications, reminders, games, progress, or needs emergency help, use the appropriate tool function."""

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
        Executes tools deterministically based on keyword intent across all 8 supported languages.
        """
        msg_lower = message.lower()
        norm_lang = language.lower().split("-")[0]

        # 1. Medicine / Reminder query
        if any(w in msg_lower for w in ["medicine", "pill", "medication", "dose", "tablet", "dawaii", "dawa", "দৰব", "ঔষধ", "दवाई", "औषध", "মুলি", "হিদাক", "damdawi"]):
            if db:
                executed_tools.append("get_medication_schedule")
                meds = AIToolsService.get_medication_schedule(db, patient_id)
                active_meds = meds.get("medications", [])
                if active_meds:
                    med_names = ", ".join(m["name"] + f" ({m['time_of_day']})" for m in active_meds[:3])
                    if norm_lang == "hi":
                        return f"आपकी आज की दवाई (दवाइयों) में {med_names} शामिल हैं।"
                    elif norm_lang == "as":
                        return f"আপোনাৰ আজিৰ ঔষধসমূহৰ ভিতৰত {med_names} আছে।"
                    elif norm_lang == "brx":
                        return f"नोंथांनि दिनैनि मुलिफोरनि मादाव {med_names} दं।"
                    elif norm_lang == "mni":
                        return f"নহাক্কী ঙসিগী হিদাকশিংগী মনুংদা {med_names} য়াওরি।"
                    elif norm_lang in ["kokborok", "trp"]:
                        return f"नोंनि दिनैनि औसधफोरनि मादाव {med_names} दं।"
                    elif norm_lang in ["mizo", "lus"]:
                        return f"Vawiina i damdawi ei turah {med_names} an tel e."
                    elif norm_lang in ["kha", "khasi"]:
                        return f"Ki dawai ba dei ban dih ki kynthup ia: {med_names}."
                    return f"Your scheduled medications include: {med_names}. Please take them with water as advised."
            if norm_lang == "hi":
                return "कृपया अपनी दैनिक दवाइयों के समय की जांच करें।"
            elif norm_lang == "as":
                return "অনুগ্ৰহ কৰি আপোনাৰ দৈনিক ঔষধৰ সময়সূচী পৰীক্ষা কৰক।"
            elif norm_lang == "brx":
                return "अननानै नोंथांनि मुलि समखौ नायबिजির।"
            elif norm_lang == "mni":
                return "চানবীদুনা নহাক্কী নোংমগী হিদাক মতম য়েংশিনবীয়ু।"
            elif norm_lang in ["kokborok", "trp"]:
                return "अननानै नोंनि औसध सम नायबिजির।"
            elif norm_lang in ["mizo", "lus"]:
                return "Khawngaihin i damdawi ei hun tur enfiah rawh."
            elif norm_lang in ["kha", "khasi"]:
                return "Sngewbha peit ia ka por dih dawai jong phi."
            return "Please check your daily schedule for your medication times."

        # 2. Activity / Next Game query
        if any(w in msg_lower for w in ["game", "activity", "play", "start", "exercise", "khel", "খেল", "খেলা", "खेल", "गेलेनाय"]):
            if db:
                executed_tools.append("get_next_recommended_game")
                rec = AIToolsService.get_next_recommended_game(db, patient_id)
                if "game_name" in rec:
                    name = rec["game_name"]
                    diff = rec["target_difficulty"]
                    if norm_lang == "hi":
                        return f"आपके लिए अगला गतिविधि खेल '{name}' (स्तर {diff}) है। क्या आप इसे शुरू करना चाहेंगे?"
                    elif norm_lang == "as":
                        return f"আপোনাৰ বাবে পৰৱৰ্তী কাৰ্যকলাপ হৈছে '{name}' (স্তৰ {diff})। আপুনি আৰম্ভ কৰিব নেকি?"
                    elif norm_lang == "brx":
                        return f"नोंथांनि थाखाय उननि गेलेनाया जाबाय '{name}' (थाखो {diff})।"
                    elif norm_lang == "mni":
                        return f"নহাক্কীদমক মথংগী শানবা য়াবা খেলা অদুদি '{name}' (থাক {diff}) নি।"
                    elif norm_lang in ["kokborok", "trp"]:
                        return f"नोंनि थाखाय उननि गेलेनाय जाबाय '{name}' (थाखो {diff})।"
                    elif norm_lang in ["mizo", "lus"]:
                        return f"I khelh leh tur chu '{name}' (level {diff}) a ni e."
                    elif norm_lang in ["kha", "khasi"]:
                        return f"Ka jingialehkai ba la ai jingmut ka long '{name}' (kyrdan {diff})."
                    return f"You have a recommended activity: '{name}' at level {diff}. Would you like to start?"
            return "You have pleasant cognitive activities prepared for you. Tap the play button whenever you are ready."

        # 3. Schedule / Reminders query
        if any(w in msg_lower for w in ["reminder", "schedule", "routine", "next", "now", "kya karu", "সময়", "সোঁৱৰণী", "याद"]):
            if db:
                executed_tools.append("get_upcoming_reminders")
                rem = AIToolsService.get_upcoming_reminders(db, patient_id)
                next_rem = rem.get("next_upcoming_reminder")
                if next_rem:
                    title = next_rem["title"]
                    t = next_rem["scheduled_time"]
                    if norm_lang == "hi":
                        return f"आपका अगला रिमाइंडर '{title}' {t} बजे निर्धारित है।"
                    elif norm_lang == "as":
                        return f"আপোনাৰ পৰৱৰ্তী সোঁৱৰণি '{title}' {t} বজাত আছে।"
                    elif norm_lang == "brx":
                        return f"नोंथांनि उननि गोसोखांहोग्राया '{title}' {t} रिंगायाव दं।"
                    elif norm_lang == "mni":
                        return f"নহাক্কী মথংগী নীংশিংবা '{title}' {t} মতমদা লৈরি।"
                    elif norm_lang in ["kokborok", "trp"]:
                        return f"नोंनि उननि रिमाइंडर '{title}' {t} समाव दं।"
                    elif norm_lang in ["mizo", "lus"]:
                        return f"I hriattirna leh tur '{title}' hi dar {t}-ah a ni e."
                    elif norm_lang in ["kha", "khasi"]:
                        return f"Ka jingpyrkhat kynmaw ban bud pat '{title}' ha ka por {t}."
                    return f"Your next reminder is '{title}' scheduled for {t}."

        # Generic friendly fallback
        if norm_lang == "hi":
            return "नमस्ते! मैं मेमोग्राम सहायक हूँ। आप अपनी गतिविधियों, दवाइयों या दिनचर्या के बारे में मुझसे पूछ सकते हैं।"
        elif norm_lang == "as":
            return "নমস্কাৰ! মই মেম'গ্ৰাম সহায়ক। আপোনাৰ কাৰ্যকলাপ বা ঔষধৰ বিষয়ে মোক সুধিব পাৰে।"
        elif norm_lang == "brx":
            return "खुलुमबाय! आं मेमोग्राम हेफाजाबगिरि। नोंथाङा हाबाफारि एबा मुलिनि बागै सोंनो हागौ।"
        elif norm_lang == "mni":
            return "খুরুমজরি! ঐহাক মেমোগ্রাম মতেং পাংবা মরুপনি। নহাক্না থবক অমসুং হিদাক্কী মরমদা হংবা য়াগনি।"
        elif norm_lang in ["kokborok", "trp"]:
            return "खुलुमबाय! आं मेमोग्राम मददगिरि। नोंनि हाबा एবা औसधनि बागै सोंनो हागौ।"
        elif norm_lang in ["mizo", "lus"]:
            return "Chibai! Memogram puihtu ka ni e. I hunbi leh damdawi chungchang min zawt thei e."
        elif norm_lang in ["kha", "khasi"]:
            return "Khublei! Nga dei u Memogram iarap. Phi lah ban kylli ia ki kam, jingkynmaw ne dawai jong phi."
        return "Hello! I am Memogram. You can ask me about your daily activities, upcoming reminders, or medicine schedule."
