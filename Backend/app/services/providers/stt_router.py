from typing import Optional, Dict
from app.services.providers.base import STTProvider, STTResult
from app.services.providers.sarvam_provider import SarvamProvider
from app.services.providers.bhashini_provider import BhashiniProvider


class STTRouter(STTProvider):
    """
    Provider-Agnostic Speech-To-Text (STT) Router.
    Routes audio transcription requests based on language:
    - Sarvam Saaras v3: Assamese, Bodo, Manipuri / Meitei, Hindi, English
    - Unsupported voice languages (Kokborok, Mizo, Khasi) fail gracefully.
    Bhashini is removed from active voice routing path.
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

    SARVAM_LANGUAGES = {"as", "brx", "mni", "hi", "en"}
    UNSUPPORTED_VOICE_LANGUAGES = {"kokborok", "trp", "mizo", "lus", "khasi", "kha"}

    def __init__(
        self,
        sarvam_provider: Optional[SarvamProvider] = None,
        bhashini_provider: Optional[BhashiniProvider] = None,
    ):
        self.sarvam = sarvam_provider or SarvamProvider()
        # Retained for backwards compatibility / legacy experiments, but not in active voice path
        self.bhashini = bhashini_provider or BhashiniProvider()

    def get_provider_for_language(self, language: str) -> str:
        base = language.lower().split("-")[0]
        if base in self.SARVAM_LANGUAGES:
            return "sarvam"
        return "unsupported"

    def is_language_available(self, language: str) -> bool:
        base = language.lower().split("-")[0]
        if base in self.SARVAM_LANGUAGES:
            return self.sarvam.is_available()
        return False

    async def transcribe(
        self,
        audio_data: bytes,
        language: str = "as",
        content_type: str = "audio/wav",
    ) -> STTResult:
        base = language.lower().split("-")[0]

        # 1. Sarvam Saaras v3 for Assamese, Bodo, Manipuri, Hindi, English
        if base in self.SARVAM_LANGUAGES:
            return await self.sarvam.transcribe(
                audio_data=audio_data,
                language=language,
                content_type=content_type,
            )

        # 2. Unsupported voice language (Kokborok, Mizo, Khasi, etc.) - honest graceful state
        return STTResult(
            text="",
            language=language,
            confidence=0.0,
            provider="unsupported",
        )
