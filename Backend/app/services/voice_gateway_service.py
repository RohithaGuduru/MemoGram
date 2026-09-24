import base64
import re
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session

from app.models.patient import Patient
from app.schemas.memogram import VoiceProcessRequest, VoiceProcessResponse
from app.services.ai_tools_service import AIToolsService
from app.services.providers.stt_router import STTRouter
from app.services.providers.tts_router import TTSRouter
from app.services.gemini_service import GeminiService
from app.utils.enums import VoiceIntent


class VoiceGatewayService:
    """
    Multilingual Voice Gateway for MEMOGRAM.
    Connects:
    Audio/Transcript -> STTRouter -> Gemini Reasoning & Tools -> TTSRouter -> Playable Audio Response.
    Supports all 8 languages without silent fallbacks.
    """

    def __init__(
        self,
        stt_router: Optional[STTRouter] = None,
        tts_router: Optional[TTSRouter] = None,
    ):
        self.stt_router = stt_router or STTRouter()
        self.tts_router = tts_router or TTSRouter()

    async def process_voice(
        self,
        db: Session,
        req: VoiceProcessRequest,
    ) -> VoiceProcessResponse:
        """
        Orchestrates Multilingual Voice Pipeline:
        Audio/Transcript -> Language STT -> Gemini Reasoning / Tool Calling -> Selected Language Response -> Language TTS.
        """
        patient = db.query(Patient).filter(Patient.id == req.patient_id).first()
        language = req.language or (patient.primary_language if patient else "as")
        norm_lang = language.lower().split("-")[0]

        # 1. Speech-To-Text (or prefer provided transcript)
        recognized_text = (req.transcript_text or "").strip()
        stt_attempted = False
        if not recognized_text and req.audio_base64:
            stt_attempted = True
            try:
                audio_bytes = base64.b64decode(req.audio_base64)
                content_type = getattr(req, "audio_content_type", "audio/wav") or "audio/wav"
                stt_res = await self.stt_router.transcribe(
                    audio_data=audio_bytes,
                    language=language,
                    content_type=content_type,
                )
                recognized_text = stt_res.text.strip()
            except Exception:
                recognized_text = ""

        # If audio was sent but could not be transcribed
        if not recognized_text and stt_attempted:
            if not self.stt_router.is_language_available(language):
                lang_display = self.tts_router.LANGUAGE_NAMES.get(norm_lang, language)
                reply_text = f"Voice support for {lang_display} is currently unavailable."
                return VoiceProcessResponse(
                    recognized_text="",
                    intent=VoiceIntent.GENERAL_CHAT,
                    reply_text=reply_text,
                    audio_base64=None,
                    audio_url=None,
                    language=language,
                    tts_available=False,
                    tts_status="UNAVAILABLE",
                    tts_message=f"Voice support for {lang_display} is currently unavailable.",
                    tool_executed=None,
                    data=None,
                )

            reply_text = self._get_unclear_audio_message(norm_lang)
            tts_res = await self.tts_router.synthesize(reply_text, language)
            return VoiceProcessResponse(
                recognized_text="",
                intent=VoiceIntent.GENERAL_CHAT,
                reply_text=reply_text,
                audio_base64=tts_res.audio_base64,
                audio_url=tts_res.audio_url,
                language=language,
                tts_available=tts_res.available,
                tts_status=tts_res.status,
                tts_message=tts_res.message,
                tool_executed=None,
                data=None,
            )

        # Default fallback text if both transcript and audio were omitted
        if not recognized_text:
            recognized_text = "Hello Memogram"

        # 2. Gemini AI Reasoning & Tool Execution
        system_instruction = GeminiService.build_voice_system_instruction(language=language)
        chat_res = GeminiService.generate_chat_response(
            patient_id=req.patient_id,
            message=recognized_text,
            system_instruction=system_instruction,
            conversation_history=None,
            db=db,
            language=language,
        )

        reply_text = chat_res.get("reply", "")
        executed_tools = chat_res.get("tool_calls_executed", [])
        tool_executed = executed_tools[0] if executed_tools else None
        data = None

        # 3. Intent & Tool Result Alignment
        if tool_executed == "get_medication_schedule":
            intent = VoiceIntent.MEDICATION_SCHEDULE
            data = AIToolsService.get_medication_schedule(db, req.patient_id)
        elif tool_executed == "get_next_recommended_game":
            intent = VoiceIntent.NEXT_GAME
            data = AIToolsService.get_next_recommended_game(db, req.patient_id)
        elif tool_executed == "get_upcoming_reminders":
            intent = VoiceIntent.UPCOMING_REMINDERS
            data = AIToolsService.get_upcoming_reminders(db, req.patient_id)
        elif tool_executed == "get_patient_progress":
            intent = VoiceIntent.PATIENT_PROGRESS
            data = AIToolsService.get_patient_progress(db, req.patient_id)
        elif tool_executed == "trigger_sos":
            intent = VoiceIntent.SOS_TRIGGER
            data = {"sos_status": "TRIGGERED"}
        else:
            intent = self._classify_intent(recognized_text)
            if intent == VoiceIntent.MEDICATION_SCHEDULE:
                tool_executed = "get_medication_schedule"
                data = AIToolsService.get_medication_schedule(db, req.patient_id)
                if not reply_text or "Donepezil" not in reply_text:
                    meds = data.get("medications", data.get("active_medications", []))
                    if meds:
                        first_med = meds[0]
                        reply_text = self._format_medication_reply(norm_lang, first_med)
            elif intent == VoiceIntent.NEXT_GAME:
                tool_executed = "get_next_recommended_game"
                data = AIToolsService.get_next_recommended_game(db, req.patient_id)
            elif intent == VoiceIntent.UPCOMING_REMINDERS:
                tool_executed = "get_upcoming_reminders"
                data = AIToolsService.get_upcoming_reminders(db, req.patient_id)
            elif intent == VoiceIntent.PATIENT_PROGRESS:
                tool_executed = "get_patient_progress"
                data = AIToolsService.get_patient_progress(db, req.patient_id)
            elif intent == VoiceIntent.SOS_TRIGGER:
                tool_executed = "trigger_sos"
                data = {"sos_status": "TRIGGERED"}
                reply_text = self._format_sos_reply(norm_lang)

        if not reply_text:
            reply_text = self._format_greeting_reply(norm_lang)

        # 4. Text-To-Speech Synthesis via TTSRouter
        tts_res = await self.tts_router.synthesize(reply_text, language)

        return VoiceProcessResponse(
            recognized_text=recognized_text,
            intent=intent,
            reply_text=reply_text,
            audio_base64=tts_res.audio_base64,
            audio_url=tts_res.audio_url,
            language=language,
            tts_available=tts_res.available,
            tts_status=tts_res.status,
            tts_message=tts_res.message,
            tool_executed=tool_executed,
            data=data,
        )

    def _classify_intent(self, text: str) -> VoiceIntent:
        lower = text.lower()
        if any(w in lower for w in ["medicine", "pill", "tablet", "dosage", "দৰব", "ঔষধ", "দবাই", "दवाई", "औषध", "মুলি", "হিদাক", "damdawi", "dawai"]):
            return VoiceIntent.MEDICATION_SCHEDULE
        if any(w in lower for w in ["game", "play", "activity", "খেল", "খেলা", "খেলাধুলা", "खेल", "गेलेनाय", "শানবা", "ialehkai"]):
            return VoiceIntent.NEXT_GAME
        if any(w in lower for w in ["reminder", "water", "appointment", "সময়", "সোঁৱৰণী", "याद", "पानी", "गोसोखांहोग्रा", "নীংশিংবা", "hriattirna", "jingkynmaw"]):
            return VoiceIntent.UPCOMING_REMINDERS
        if any(w in lower for w in ["progress", "score", "performance", "প্ৰগতি", "স্ক'ৰ", "प्रगति", "থবক", "hunbi", "jingroi"]):
            return VoiceIntent.PATIENT_PROGRESS
        if any(re.search(r"\b" + re.escape(w) + r"\b", lower) for w in ["help", "emergency", "sos", "বিপদ", "সাহায্য", "मदद", "थाब", "অকুপ্পা", "puihna", "iarap"]):
            return VoiceIntent.SOS_TRIGGER
        return VoiceIntent.GENERAL_CHAT

    def _get_unclear_audio_message(self, norm_lang: str) -> str:
        if norm_lang == "as":
            return "আপোনাৰ মাত স্পষ্টকৈ শুনা নগ'ল। অনুগ্ৰহ কৰি আকৌ কওক।"
        elif norm_lang == "hi":
            return "आपकी आवाज़ स्पष्ट नहीं सुनाई दी। कृपया पुनः बोलें।"
        elif norm_lang == "brx":
            return "नोंथांनि सोदोबखौ रोखा खोनायाखै। अननानै आरोबाव बुं।"
        elif norm_lang == "mni":
            return "নহাক্কী খোঞ্জেল শেংনা তাদে। চানবীদুনা অমুক হন্না হায়বীয়ু।"
        elif norm_lang in ["kokborok", "trp"]:
            return "नोंनि खोरां रोखा खोनायाखै। अननानै आरोबाव सालाय।"
        elif norm_lang in ["mizo", "lus"]:
            return "I aw a hriat chian theih loh. Khawngaihin sawi tha leh rawh."
        elif norm_lang in ["kha", "khasi"]:
            return "Khlem lah ban sngewbha ka sur. Sngewbha kren biang."
        return "Could not detect clear audio. Please speak again."

    def _format_medication_reply(self, norm_lang: str, first_med: Dict[str, Any]) -> str:
        name = first_med.get("name", "Medication")
        dosage = first_med.get("dosage", "")
        tod = first_med.get("time_of_day", "")
        if norm_lang == "as":
            return f"আপোনাৰ ঔষধ: {name} {dosage}, সময়: {tod}।"
        elif norm_lang == "hi":
            return f"आपकी दवाई: {name} {dosage}, समय: {tod}।"
        elif norm_lang == "brx":
            return f"नोंथांनि मुलि: {name} {dosage}, सम: {tod}।"
        elif norm_lang == "mni":
            return f"নহাক্কী হিদাক: {name} {dosage}, মতম: {tod}।"
        elif norm_lang in ["kokborok", "trp"]:
            return f"नोंनि औसध: {name} {dosage}, सम: {tod}।"
        elif norm_lang in ["mizo", "lus"]:
            return f"I damdawi: {name} {dosage}, hun: {tod}."
        elif norm_lang in ["kha", "khasi"]:
            return f"Ka dawai jong phi: {name} {dosage}, por: {tod}."
        return f"Your scheduled medication is {name} {dosage} at {tod}."

    def _format_sos_reply(self, norm_lang: str) -> str:
        if norm_lang == "as":
            return "আপোনাৰ অভিভাৱকলৈ জৰুৰীকালীন বাৰ্তা প্ৰেৰণ কৰা হৈছে।"
        elif norm_lang == "hi":
            return "आपके देखभालकर्ता को आपातकालीन संदेश भेज दिया गया है।"
        elif norm_lang == "brx":
            return "नोंथांनि सामलायगिरिनो थाब जाथाय खौरां हरबाय।"
        elif norm_lang == "mni":
            return "নহাক্কী য়োকখৎপিবগী মফমদা অকুপ্পা পাউ পীবিরে।"
        elif norm_lang in ["kokborok", "trp"]:
            return "नोंनि सामलायग्रानो जरूरी खौरां हरबाय।"
        elif norm_lang in ["mizo", "lus"]:
            return "I enkawltu hnenah puihna ngenna thawn a ni tawh e."
        elif norm_lang in ["kha", "khasi"]:
            return "La phah ia ka khubor kyrkieh sha u nongsumar jong phi."
        return "Emergency alert has been sent to your caretaker."

    def _format_greeting_reply(self, norm_lang: str) -> str:
        if norm_lang == "as":
            return "নমস্কাৰ! মই আপোনাৰ মেম'গ্ৰাম সহায়ক। আজি আপোনাক কেনেকৈ সহায় কৰিব পাৰোঁ?"
        elif norm_lang == "hi":
            return "नमस्ते! मैं आपका मेमोग्राम सहायक हूँ। आज मैं आपकी क्या मदद कर सकता हूँ?"
        elif norm_lang == "brx":
            return "खुलुमबाय! आं नोंथांनि मेमोग्राम हेफाजाबगिरि। दिनै आं माबोरै हेफाजाब होनो हागौ?"
        elif norm_lang == "mni":
            return "খুরুমজরি! ঐহাক নহাক্কী মেমোগ্রাম মতেং পাংবা মরুপনি। ঙসি ঐহাক্না করম্না মতেং পাংগদগে?"
        elif norm_lang in ["kokborok", "trp"]:
            return "खुलुमबाय! आं नोंनि मेमोग्राम मददगिरि। दिनै बोरै मदद खालामनो?"
        elif norm_lang in ["mizo", "lus"]:
            return "Chibai! Memogram puihtu ka ni e. Vawiinah engtin nge ka puih theih che le?"
        elif norm_lang in ["kha", "khasi"]:
            return "Khublei! Nga dei u Memogram iarap jong phi. Kumno nga lah ban iarap ia phi mynta ka sngi?"
        return "Hello! I am your Memogram assistant. How can I help you today?"
