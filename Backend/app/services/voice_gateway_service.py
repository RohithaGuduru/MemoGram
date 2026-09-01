import base64
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session

from app.models.patient import Patient
from app.models.medication import Medication
from app.models.reminder import Reminder
from app.schemas.memogram import VoiceProcessRequest, VoiceProcessResponse
from app.services.ai_tools_service import AIToolsService
from app.services.providers.sarvam_provider import SarvamProvider
from app.services.providers.tts_router import TTSRouter
from app.utils.enums import VoiceIntent


class VoiceGatewayService:

    def __init__(self):
        self.sarvam = SarvamProvider()
        self.tts_router = TTSRouter()

    async def process_voice(
        self,
        db: Session,
        req: VoiceProcessRequest,
    ) -> VoiceProcessResponse:
        """
        Orchestrates Mobile Voice Pipeline:
        Audio/Text -> STT -> Intent Understanding -> Database Lookup -> Primary-Language Response -> TTS Router.
        """
        patient = db.query(Patient).filter(Patient.id == req.patient_id).first()
        language = req.language or (patient.primary_language if patient else "as")
        norm_lang = language.lower().split("-")[0]

        # 1. Speech-To-Text (or use provided transcript)
        recognized_text = req.transcript_text or ""
        if not recognized_text and req.audio_base64:
            try:
                audio_bytes = base64.b64decode(req.audio_base64)
                stt_res = await self.sarvam.transcribe(audio_bytes, language)
                recognized_text = stt_res.text
            except Exception:
                recognized_text = "Audio could not be decoded"

        if not recognized_text:
            recognized_text = "Hello Memogram"

        # 2. Intent Understanding (Keyword & Semantic Intent Classification)
        intent = self._classify_intent(recognized_text)
        tool_executed = None
        data = None
        reply_text = ""

        # 3. Database Operation & Response Generation
        if intent == VoiceIntent.MEDICATION_SCHEDULE:
            tool_executed = "get_medication_schedule"
            data = AIToolsService.get_medication_schedule(db, req.patient_id)
            meds = data.get("medications", data.get("active_medications", []))
            if meds:
                first_med = meds[0]
                if norm_lang == "as":
                    reply_text = f"আপোনাৰ ঔষধ: {first_med['name']} {first_med['dosage']}, সময়: {first_med['time_of_day']}।"
                elif norm_lang == "hi":
                    reply_text = f"आपकी दवाई: {first_med['name']} {first_med['dosage']}, समय: {first_med['time_of_day']}।"
                elif norm_lang == "brx":
                    reply_text = f"नोंथांनि मुलि: {first_med['name']} {first_med['dosage']}, सम: {first_med['time_of_day']}।"
                elif norm_lang == "mni":
                    reply_text = f"নহাক্কী হিদাক: {first_med['name']} {first_med['dosage']}, মতম: {first_med['time_of_day']}।"
                elif norm_lang in ["kokborok", "trp"]:
                    reply_text = f"नोंनि औसध: {first_med['name']} {first_med['dosage']}, सम: {first_med['time_of_day']}।"
                elif norm_lang in ["mizo", "lus"]:
                    reply_text = f"I damdawi: {first_med['name']} {first_med['dosage']}, hun: {first_med['time_of_day']}."
                else:
                    reply_text = f"Your scheduled medication is {first_med['name']} {first_med['dosage']} at {first_med['time_of_day']}."
            else:
                if norm_lang == "as":
                    reply_text = "আজি আপোনাৰ কোনো নিৰ্ধাৰিত ঔষধ পোৱা নগ'ল।"
                elif norm_lang == "hi":
                    reply_text = "आज आपकी कोई निर्धारित दवाई नहीं है।"
                elif norm_lang == "brx":
                    reply_text = "दिनै नोंथांनि जेबो मुलि गैथवा।"
                elif norm_lang == "mni":
                    reply_text = "ঙসি অদোমগী করিগুম্বা হিদাক লৈতে।"
                elif norm_lang in ["kokborok", "trp"]:
                    reply_text = "दिनै नोंनि जेबो औसध गैया।"
                elif norm_lang in ["mizo", "lus"]:
                    reply_text = "Vawiinah damdawi ei tur i nei rih lo e."
                else:
                    reply_text = "No active scheduled medications found for today."

        elif intent == VoiceIntent.NEXT_GAME:
            tool_executed = "get_next_recommended_game"
            data = AIToolsService.get_next_recommended_game(db, req.patient_id)
            game_name = data.get("game_name", "Memory Shopping")
            if norm_lang == "as":
                reply_text = f"আজিৰ বাবে পৰামৰ্শ দিয়া খেল হৈছে {game_name}।"
            elif norm_lang == "hi":
                reply_text = f"आज आपके लिए अनुशंसित खेल है {game_name}।"
            elif norm_lang == "brx":
                reply_text = f"दिनैनि थाखाय सायखनाय गेलेनाया जाबाय {game_name}।"
            elif norm_lang == "mni":
                reply_text = f"ঙসিগীদমক শানবা য়াবা খেলা অদুদি {game_name} নি।"
            elif norm_lang in ["kokborok", "trp"]:
                reply_text = f"दिनैनि थाखाय मोजां गेलेनाय जाबाय {game_name}।"
            elif norm_lang in ["mizo", "lus"]:
                reply_text = f"Vawiina i khelh atan {game_name} kan rawt e."
            else:
                reply_text = f"Your next recommended activity is {game_name}."

        elif intent == VoiceIntent.UPCOMING_REMINDERS:
            tool_executed = "get_upcoming_reminders"
            data = AIToolsService.get_upcoming_reminders(db, req.patient_id)
            count = data.get("total_active_reminders", 0)
            if norm_lang == "as":
                reply_text = f"আজি আপোনাৰ {count}টা সোঁৱৰণী বাকী আছে।"
            elif norm_lang == "hi":
                reply_text = f"आज आपके {count} रिमाइंडर बाकी हैं।"
            elif norm_lang == "brx":
                reply_text = f"दिनै नोंथांनि {count} गोसोखांहोग्रा दं।"
            elif norm_lang == "mni":
                reply_text = f"ঙসি নহাক্কী {count} নীংশিংবা লৈরি।"
            elif norm_lang in ["kokborok", "trp"]:
                reply_text = f"दिनै नोंनि {count} रिमाइंडर दं।"
            elif norm_lang in ["mizo", "lus"]:
                reply_text = f"Vawiinah hriattirna {count} i nei e."
            else:
                reply_text = f"You have {count} upcoming reminders for today."

        elif intent == VoiceIntent.PATIENT_PROGRESS:
            tool_executed = "get_patient_progress"
            data = AIToolsService.get_patient_progress(db, req.patient_id)
            total = data.get("total_sessions_completed", 0)
            if norm_lang == "as":
                reply_text = f"আপুনি এতিয়ালৈকে {total}টা কাৰ্যকলাপ সম্পূৰ্ণ কৰিছে। বৰ সুন্দৰ!"
            elif norm_lang == "hi":
                reply_text = f"आपने अब तक {total} गतिविधियाँ पूरी की हैं। बहुत बढ़िया!"
            elif norm_lang == "brx":
                reply_text = f"नोंथाङा दासिम {total} हाबाफारि जोबबाय। जोबोद मोजां!"
            elif norm_lang == "mni":
                reply_text = f"নহাক্না হৌজিক ফাওবদা {total} থবক লোইশিল্লে। য়াম্না ফৈ!"
            elif norm_lang in ["kokborok", "trp"]:
                reply_text = f"नों दासिम {total} गेलेनाय खालामबाय। मोजां!"
            elif norm_lang in ["mizo", "lus"]:
                reply_text = f"Tun thlengin hunbi {total} i zo tawh e. A tha lutuk e!"
            else:
                reply_text = f"You have successfully completed {total} activity sessions. Great progress!"

        elif intent == VoiceIntent.SOS_TRIGGER:
            tool_executed = "trigger_sos"
            if norm_lang == "as":
                reply_text = "আপোনাৰ অভিভাৱকলৈ জৰুৰীকালীন বাৰ্তা প্ৰেৰণ কৰা হৈছে।"
            elif norm_lang == "hi":
                reply_text = "आपके देखभालकर्ता को आपातकालीन संदेश भेज दिया गया है।"
            elif norm_lang == "brx":
                reply_text = "नोंथांनि सामलायगिरिनो थाब जाथाय खौरां हरबाय।"
            elif norm_lang == "mni":
                reply_text = "নহাক্কী য়োকখৎপিবগী মফমদা অকুপ্পা পাউ পীবিরে।"
            elif norm_lang in ["kokborok", "trp"]:
                reply_text = "नोंनि सामलायग्रानो जरूरी खौरां हरबाय।"
            elif norm_lang in ["mizo", "lus"]:
                reply_text = "I enkawltu hnenah puihna ngenna thawn a ni tawh e."
            else:
                reply_text = "Emergency alert has been sent to your caretaker."

        else:
            if norm_lang == "as":
                reply_text = "নমস্কাৰ! মই আপোনাৰ মেম'গ্ৰাম সহায়ক। আজি আপোনাক কেনেকৈ সহায় কৰিব পাৰোঁ?"
            elif norm_lang == "hi":
                reply_text = "नमस्ते! मैं आपका मेमोग्राम सहायक हूँ। आज मैं आपकी क्या मदद कर सकता हूँ?"
            elif norm_lang == "brx":
                reply_text = "खुलुमबाय! आं नोंथांनि मेमोग्राम हेफाजाबगिरि। दिनै आं माबोरै हेफाजाब होनो हागौ?"
            elif norm_lang == "mni":
                reply_text = "খুরুমজরি! ঐহাক নহাক্কী মেমোগ্রাম মতেং পাংবা মরুপনি। ঙসি ঐহাক্না করম্না মতেং পাংগদগে?"
            elif norm_lang in ["kokborok", "trp"]:
                reply_text = "खुलुमबाय! आं नोंनि मेमोग्राम मददगिरि। दिनै बोरै मदद खालामनो?"
            elif norm_lang in ["mizo", "lus"]:
                reply_text = "Chibai! Memogram puihtu ka ni e. Vawiinah engtin nge ka puih theih che le?"
            else:
                reply_text = "Hello! I am your Memogram assistant. How can I help you today?"

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
        if any(w in lower for w in ["medicine", "pill", "tablet", "dosage", "দৰব", "ঔষধ", "দবাই", "दवाई", "औषध"]):
            return VoiceIntent.MEDICATION_SCHEDULE
        if any(w in lower for w in ["game", "play", "activity", "খেল", "খেলা", "খেলাধুলা", "खेल"]):
            return VoiceIntent.NEXT_GAME
        if any(w in lower for w in ["reminder", "water", "appointment", "সময়", "সোঁৱৰণী", "याद", "पानी"]):
            return VoiceIntent.UPCOMING_REMINDERS
        if any(w in lower for w in ["progress", "score", "performance", "প্ৰগতি", "স্ক'ৰ", "प्रगति"]):
            return VoiceIntent.PATIENT_PROGRESS
        if any(w in lower for w in ["help", "emergency", "sos", "বিপদ", "সাহায্য", "मदद"]):
            return VoiceIntent.SOS_TRIGGER
        return VoiceIntent.GENERAL_CHAT
