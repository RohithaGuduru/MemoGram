from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.language_capability import LanguageCapability
from app.schemas.memogram import LanguageCapabilityResponse, LanguageCapabilityDetail, CapabilityProviderInfo
from app.utils.enums import LanguageCapabilityStatus


def get_initial_language_registry() -> List[Dict[str, Any]]:
    sarvam_active = bool((settings.SARVAM_API_KEY and len(settings.SARVAM_API_KEY) > 5) or settings.DEBUG)
    indic_parler_active = bool(settings.INDIC_PARLER_TTS_ENABLED and (settings.INDIC_PARLER_TTS_ENDPOINT or settings.INDIC_PARLER_TTS_MODEL))
    azure_tts_active = bool(settings.AZURE_SPEECH_KEY and len(settings.AZURE_SPEECH_KEY) > 10)

    def calc_status(stt: bool, tts: bool) -> LanguageCapabilityStatus:
        if stt and tts:
            return LanguageCapabilityStatus.AVAILABLE
        elif stt or tts:
            return LanguageCapabilityStatus.PARTIAL
        return LanguageCapabilityStatus.IN_DEVELOPMENT

    return [
        {
            "language_code": "as",
            "display_name": "Assamese",
            "native_name": "অসমীয়া",
            "script": "Bengali-Assamese",
            "text_available": True,
            "ui_text_available": True,
            "stt_available": sarvam_active,
            "stt_provider": "sarvam",
            "translation_available": sarvam_active,
            "translation_provider": "sarvam",
            "tts_available": indic_parler_active,
            "tts_provider": "indic_parler",
            "status": calc_status(sarvam_active, indic_parler_active),
            "enabled": True,
            "metadata_info": {"notes": "Assamese STT via Sarvam Saaras v3, TTS routed via Indic Parler-TTS."},
        },
        {
            "language_code": "brx",
            "display_name": "Bodo",
            "native_name": "बर’",
            "script": "Devanagari",
            "text_available": True,
            "ui_text_available": True,
            "stt_available": sarvam_active,
            "stt_provider": "sarvam",
            "translation_available": sarvam_active,
            "translation_provider": "sarvam",
            "tts_available": indic_parler_active,
            "tts_provider": "indic_parler",
            "status": calc_status(sarvam_active, indic_parler_active),
            "enabled": True,
            "metadata_info": {"notes": "Bodo STT via Sarvam Saaras v3, TTS routed via Indic Parler-TTS."},
        },
        {
            "language_code": "mni",
            "display_name": "Manipuri / Meitei",
            "native_name": "মৈতৈলোন্",
            "script": "Meetei Mayek / Bengali",
            "text_available": True,
            "ui_text_available": True,
            "stt_available": sarvam_active,
            "stt_provider": "sarvam",
            "translation_available": sarvam_active,
            "translation_provider": "sarvam",
            "tts_available": indic_parler_active,
            "tts_provider": "indic_parler",
            "status": calc_status(sarvam_active, indic_parler_active),
            "enabled": True,
            "metadata_info": {"notes": "Manipuri STT via Sarvam Saaras v3, TTS routed via Indic Parler-TTS."},
        },
        {
            "language_code": "kokborok",
            "display_name": "Kokborok",
            "native_name": "ককবরক",
            "script": "Bengali / Latin",
            "text_available": True,
            "ui_text_available": True,
            "stt_available": False,
            "stt_provider": "none",
            "translation_available": False,
            "translation_provider": "none",
            "tts_available": False,
            "tts_provider": "none",
            "status": LanguageCapabilityStatus.IN_DEVELOPMENT,
            "enabled": True,
            "metadata_info": {"notes": "Kokborok speech provider integration in development."},
        },
        {
            "language_code": "mizo",
            "display_name": "Mizo",
            "native_name": "Mizo ṭawng",
            "script": "Latin",
            "text_available": True,
            "ui_text_available": True,
            "stt_available": False,
            "stt_provider": "none",
            "translation_available": False,
            "translation_provider": "none",
            "tts_available": False,
            "tts_provider": "none",
            "status": LanguageCapabilityStatus.IN_DEVELOPMENT,
            "enabled": True,
            "metadata_info": {"notes": "Mizo speech provider integration in development."},
        },
        {
            "language_code": "kha",
            "display_name": "Khasi",
            "native_name": "Ka Ktien Khasi",
            "script": "Latin",
            "text_available": True,
            "ui_text_available": True,
            "stt_available": False,
            "stt_provider": "none",
            "translation_available": False,
            "translation_provider": "none",
            "tts_available": False,
            "tts_provider": "none",
            "status": LanguageCapabilityStatus.IN_DEVELOPMENT,
            "enabled": True,
            "metadata_info": {"notes": "Khasi speech provider integration in development."},
        },
        {
            "language_code": "hi",
            "display_name": "Hindi",
            "native_name": "हिन्दी",
            "script": "Devanagari",
            "text_available": True,
            "ui_text_available": True,
            "stt_available": sarvam_active,
            "stt_provider": "sarvam",
            "translation_available": sarvam_active,
            "translation_provider": "sarvam",
            "tts_available": indic_parler_active or sarvam_active,
            "tts_provider": "indic_parler",
            "status": calc_status(sarvam_active, indic_parler_active or sarvam_active),
            "enabled": True,
            "metadata_info": {"notes": "Hindi STT via Sarvam Saaras v3, TTS via Indic Parler-TTS (Sarvam fallback)."},
        },
        {
            "language_code": "en",
            "display_name": "English",
            "native_name": "English",
            "script": "Latin",
            "text_available": True,
            "ui_text_available": True,
            "stt_available": sarvam_active,
            "stt_provider": "sarvam",
            "translation_available": sarvam_active,
            "translation_provider": "sarvam",
            "tts_available": indic_parler_active or sarvam_active or azure_tts_active,
            "tts_provider": "indic_parler",
            "status": calc_status(sarvam_active, indic_parler_active or sarvam_active or azure_tts_active),
            "enabled": True,
            "metadata_info": {"notes": "English STT via Sarvam Saaras v3, TTS via Indic Parler-TTS (Sarvam/Azure fallback)."},
        },
    ]


class LanguageService:

    @classmethod
    def initialize_registry_if_needed(cls, db: Session) -> None:
        """Seeds or updates language capabilities in the database."""
        registry = get_initial_language_registry()
        for item in registry:
            cap = db.query(LanguageCapability).filter(
                LanguageCapability.language_code == item["language_code"]
            ).first()
            if not cap:
                cap = LanguageCapability(
                    language_code=item["language_code"],
                    display_name=item["display_name"],
                    native_name=item["native_name"],
                    script=item["script"],
                    text_available=item["text_available"],
                    ui_text_available=item["ui_text_available"],
                    stt_available=item["stt_available"],
                    stt_provider=item["stt_provider"],
                    translation_available=item["translation_available"],
                    translation_provider=item["translation_provider"],
                    tts_available=item["tts_available"],
                    tts_provider=item["tts_provider"],
                    status=item["status"],
                    enabled=item["enabled"],
                    metadata_info=item["metadata_info"],
                )
                db.add(cap)
            else:
                # Keep provider mappings and dynamic availability updated
                cap.display_name = item["display_name"]
                cap.native_name = item["native_name"]
                cap.script = item["script"]
                cap.text_available = item["text_available"]
                cap.ui_text_available = item["ui_text_available"]
                cap.stt_available = item["stt_available"]
                cap.stt_provider = item["stt_provider"]
                cap.tts_available = item["tts_available"]
                cap.tts_provider = item["tts_provider"]
                cap.translation_available = item["translation_available"]
                cap.translation_provider = item["translation_provider"]
                cap.status = item["status"]
                cap.metadata_info = item["metadata_info"]
        db.commit()

    @classmethod
    def list_languages(cls, db: Session) -> List[LanguageCapabilityResponse]:
        """Lists all supported languages with their independent capability matrices."""
        cls.initialize_registry_if_needed(db)
        records = db.query(LanguageCapability).filter(LanguageCapability.enabled == True).all()

        responses = []
        for r in records:
            responses.append(
                LanguageCapabilityResponse(
                    language_code=r.language_code,
                    display_name=r.display_name,
                    native_name=r.native_name,
                    script=r.script,
                    text_available=r.text_available,
                    ui_text_available=r.ui_text_available,
                    capabilities=LanguageCapabilityDetail(
                        stt=CapabilityProviderInfo(available=r.stt_available, provider=r.stt_provider),
                        translation=CapabilityProviderInfo(available=r.translation_available, provider=r.translation_provider),
                        tts=CapabilityProviderInfo(available=r.tts_available, provider=r.tts_provider),
                    ),
                    status=r.status.value,
                    enabled=r.enabled,
                )
            )
        return responses

    @classmethod
    def get_language_capability(cls, db: Session, code: str) -> Optional[LanguageCapabilityResponse]:
        """Retrieves capabilities for a specific language code (normalized)."""
        cls.initialize_registry_if_needed(db)
        norm_code = code.lower().split("-")[0]
        alias_map = {"khasi": "kha", "kha": "kha", "kokborok": "kokborok", "trp": "kokborok", "mizo": "mizo", "lus": "mizo"}
        resolved_code = alias_map.get(norm_code, norm_code)
        r = db.query(LanguageCapability).filter(
            (LanguageCapability.language_code == norm_code) | 
            (LanguageCapability.language_code == resolved_code) | 
            (LanguageCapability.language_code == code.lower())
        ).first()

        if not r:
            return None

        return LanguageCapabilityResponse(
            language_code=r.language_code,
            display_name=r.display_name,
            native_name=r.native_name,
            script=r.script,
            text_available=r.text_available,
            ui_text_available=r.ui_text_available,
            capabilities=LanguageCapabilityDetail(
                stt=CapabilityProviderInfo(available=r.stt_available, provider=r.stt_provider),
                translation=CapabilityProviderInfo(available=r.translation_available, provider=r.translation_provider),
                tts=CapabilityProviderInfo(available=r.tts_available, provider=r.tts_provider),
            ),
            status=r.status.value,
            enabled=r.enabled,
        )
