from typing import Optional, Dict
from app.core.config import settings
from app.services.providers.base import TTSProvider, TTSResult
from app.services.providers.indic_parler_provider import IndicParlerTTSProvider
from app.services.providers.sarvam_provider import SarvamProvider
from app.services.providers.bhashini_provider import BhashiniProvider
from app.services.providers.azure_provider import AzureTTSProvider


class TTSRouter(TTSProvider):
    """
    Provider-Agnostic TTS Router for MEMOGRAM:
    - IndicParlerTTSProvider: Primary TTS for Assamese, Bodo, Manipuri / Meitei, Hindi, English
    - SarvamProvider / AzureTTSProvider: Fallbacks for Hindi and English only
    - Bhashini: Removed from active voice execution path
    - Unsupported voice languages (Kokborok, Mizo, Khasi): Honest UNAVAILABLE status without crashing
    
    CRITICAL RULE: Never silently converts a patient's regional language into English or Hindi.
    """

    LANGUAGE_NAMES: Dict[str, str] = {
        "as": "Assamese",
        "brx": "Bodo",
        "mni": "Manipuri / Meitei",
        "kokborok": "Kokborok",
        "trp": "Kokborok",
        "mizo": "Mizo",
        "lus": "Mizo",
        "khasi": "Khasi",
        "kha": "Khasi",
        "hi": "Hindi",
        "en": "English",
    }

    INDIC_PARLER_LANGUAGES = {"as", "brx", "mni", "hi", "en"}
    UNSUPPORTED_VOICE_LANGUAGES = {"kokborok", "trp", "mizo", "lus", "khasi", "kha"}

    def __init__(
        self,
        indic_parler_provider: Optional[IndicParlerTTSProvider] = None,
        sarvam_provider: Optional[SarvamProvider] = None,
        bhashini_provider: Optional[BhashiniProvider] = None,
        azure_provider: Optional[AzureTTSProvider] = None,
    ):
        self.indic_parler = indic_parler_provider or IndicParlerTTSProvider()
        self.sarvam = sarvam_provider or SarvamProvider()
        self.azure = azure_provider or AzureTTSProvider()
        # Retained for backwards compatibility / legacy experiments, but not in active voice path
        self.bhashini = bhashini_provider or BhashiniProvider()

    def get_provider_for_language(self, language: str) -> str:
        norm = language.lower().split("-")[0]
        if norm in self.INDIC_PARLER_LANGUAGES:
            return "indic_parler"
        return "unsupported"

    def is_language_available(self, language: str) -> bool:
        norm = language.lower().split("-")[0]
        if norm in self.INDIC_PARLER_LANGUAGES:
            return (
                self.indic_parler.is_available()
                or (norm == "hi" and self.sarvam.is_available())
                or (norm == "en" and (self.sarvam.is_available() or self.azure.is_available()))
            )
        return False

    async def synthesize(self, text: str, language: str = "as") -> TTSResult:
        norm_code = language.lower().split("-")[0]
        lang_display = self.LANGUAGE_NAMES.get(norm_code, language)

        # 1. Supported Indic Parler-TTS languages (Assamese, Bodo, Manipuri, Hindi, English)
        if norm_code in self.INDIC_PARLER_LANGUAGES:
            # Primary: Indic Parler-TTS
            if self.indic_parler.is_available():
                res = await self.indic_parler.synthesize(text, language)
                if res.available:
                    return res

            # Safe fallbacks for Hindi and English if Indic Parler is unconfigured
            if norm_code == "hi":
                if self.sarvam.is_available():
                    return await self.sarvam.synthesize(text, "hi-IN")
                return TTSResult(
                    audio_base64=None,
                    audio_url=None,
                    language=language,
                    available=False,
                    status="UNAVAILABLE",
                    message="Hindi TTS provider credentials not configured.",
                )

            elif norm_code == "en":
                if self.sarvam.is_available():
                    return await self.sarvam.synthesize(text, "en-IN")
                if self.azure.is_available() and getattr(settings, "AZURE_SPEECH_KEY", None):
                    return await self.azure.synthesize(text, "en-US")
                return TTSResult(
                    audio_base64=None,
                    audio_url=None,
                    language=language,
                    available=False,
                    status="UNAVAILABLE",
                    message="English TTS provider credentials not configured.",
                )

            # Regional languages (Assamese, Bodo, Manipuri) when Indic Parler is unconfigured
            return TTSResult(
                audio_base64=None,
                audio_url=None,
                language=language,
                available=False,
                status="IN_DEVELOPMENT",
                message=f"Voice support for {lang_display} is currently under development.",
            )

        # 2. Unsupported languages (Kokborok, Mizo, Khasi) - honest unavailable state, never substitute
        return TTSResult(
            audio_base64=None,
            audio_url=None,
            language=language,
            available=False,
            status="UNAVAILABLE",
            message=f"Voice support for {lang_display} is currently unavailable.",
        )
