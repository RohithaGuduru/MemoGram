from typing import Optional, Dict
from app.core.config import settings
from app.services.providers.base import TTSProvider, TTSResult
from app.services.providers.sarvam_provider import SarvamProvider
from app.services.providers.indic_parler_provider import IndicParlerTTSProvider
from app.services.providers.azure_provider import AzureTTSProvider


class TTSRouter(TTSProvider):
    """
    Provider-Agnostic TTS Router.
    Selects TTS backends based on verified language capabilities:
    - SarvamTTSProvider (Primary for supported Indic TTS languages like Hindi)
    - IndicParlerTTSProvider (Specialized for Bodo, Manipuri/Meitei, Assamese, etc.)
    - AzureTTSProvider (English and cloud speech)
    - Structured In-Development Fallback
    
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
        "hi": "Hindi",
        "en": "English",
        "bn": "Bengali",
    }

    def __init__(self):
        self.sarvam = SarvamProvider()
        self.indic_parler = IndicParlerTTSProvider()
        self.azure = AzureTTSProvider()

    async def synthesize(self, text: str, language: str = "as") -> TTSResult:
        norm_code = language.lower().split("-")[0]
        lang_display = self.LANGUAGE_NAMES.get(norm_code, language)

        # 1. Hindi -> Sarvam is primary provider
        if norm_code == "hi":
            if self.sarvam.is_available():
                return await self.sarvam.synthesize(text, "hi-IN")
            if self.indic_parler.is_available():
                return await self.indic_parler.synthesize(text, "hi")
            return TTSResult(
                language=language,
                available=False,
                status="UNAVAILABLE",
                message="Hindi TTS provider credentials not configured.",
            )

        # 2. Bodo & Manipuri/Meitei -> Indic Parler-TTS is the dedicated provider
        elif norm_code in ["brx", "mni"]:
            if self.indic_parler.is_available():
                return await self.indic_parler.synthesize(text, norm_code)
            return TTSResult(
                audio_base64=None,
                audio_url=None,
                language=language,
                available=False,
                status="IN_DEVELOPMENT",
                message=f"Voice support for {lang_display} is currently under development.",
            )

        # 3. Assamese -> Check Indic Parler-TTS if active, otherwise report in development
        elif norm_code == "as":
            if self.indic_parler.is_available() and self.indic_parler.supports_language("as"):
                return await self.indic_parler.synthesize(text, "as")
            return TTSResult(
                audio_base64=None,
                audio_url=None,
                language=language,
                available=False,
                status="IN_DEVELOPMENT",
                message=f"Voice support for {lang_display} is currently under development.",
            )

        # 4. English -> Azure / Sarvam English
        elif norm_code == "en":
            if self.azure.is_available():
                return await self.azure.synthesize(text, "en-US")
            if self.sarvam.is_available():
                return await self.sarvam.synthesize(text, "en-IN")
            return TTSResult(
                language=language,
                available=False,
                status="UNAVAILABLE",
                message="English TTS provider credentials not configured.",
            )

        # 5. Unsupported / In-Development Regional Languages (Kokborok, Mizo, etc.)
        # CRITICAL SAFETY RULE: Never silently switch to English/Hindi voice output.
        return TTSResult(
            audio_base64=None,
            audio_url=None,
            language=language,
            available=False,
            status="IN_DEVELOPMENT",
            message=f"Voice support for {lang_display} is currently under development.",
        )
