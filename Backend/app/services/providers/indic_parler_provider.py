import base64
from typing import Optional, List, Dict
import httpx

from app.core.config import settings
from app.services.providers.base import TTSProvider, TTSResult


class IndicParlerTTSProvider(TTSProvider):
    """
    Indic Parler-TTS provider integration.
    Supports Indian languages including Bodo (brx), Manipuri/Meitei (mni),
    Assamese (as), Bengali (bn), Hindi (hi), etc. via self-hosted model or inference endpoint.
    Credentials/endpoints remain server-side only and are never exposed to clients.
    """

    SUPPORTED_LANGUAGES: Dict[str, str] = {
        "as": "Assamese",
        "brx": "Bodo",
        "mni": "Manipuri / Meitei",
        "hi": "Hindi",
        "en": "English",
        "bn": "Bengali",
    }

    def __init__(
        self,
        enabled: Optional[bool] = None,
        endpoint: Optional[str] = None,
        model: Optional[str] = None,
        api_key: Optional[str] = None,
    ):
        self.enabled = enabled if enabled is not None else settings.INDIC_PARLER_TTS_ENABLED
        self.endpoint = endpoint or settings.INDIC_PARLER_TTS_ENDPOINT or "http://localhost:8001/synthesize"
        self.model = model or settings.INDIC_PARLER_TTS_MODEL
        self.api_key = api_key or settings.INDIC_PARLER_TTS_API_KEY

    def is_available(self) -> bool:
        """Returns True if Indic Parler-TTS is enabled and an endpoint or model is configured."""
        return bool(self.enabled and (self.endpoint or self.model))

    def supports_language(self, language: str) -> bool:
        norm_code = language.lower().split("-")[0]
        return norm_code in self.SUPPORTED_LANGUAGES

    async def synthesize(self, text: str, language: str = "brx") -> TTSResult:
        norm_code = language.lower().split("-")[0]
        lang_name = self.SUPPORTED_LANGUAGES.get(norm_code, language)

        if not self.enabled:
            return TTSResult(
                audio_base64=None,
                language=language,
                available=False,
                status="IN_DEVELOPMENT",
                message=f"Voice support for {lang_name} is currently under development.",
            )

        if not self.supports_language(norm_code):
            return TTSResult(
                audio_base64=None,
                language=language,
                available=False,
                status="IN_DEVELOPMENT",
                message=f"Voice support for {lang_name} is currently under development.",
            )

        if not self.endpoint:
            return TTSResult(
                audio_base64=None,
                language=language,
                available=False,
                status="UNAVAILABLE",
                message="Indic Parler-TTS endpoint is not configured.",
            )

        try:
            headers = {"Content-Type": "application/json"}
            if self.api_key:
                headers["Authorization"] = f"Bearer {self.api_key}"

            payload = {
                "text": text,
                "language": norm_code,
                "model": self.model,
            }

            async with httpx.AsyncClient(timeout=90.0) as client:
                resp = await client.post(self.endpoint, json=payload, headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    audio_b64 = data.get("audio_base64") or data.get("audio")
                    if audio_b64:
                        return TTSResult(
                            audio_base64=audio_b64,
                            audio_url=data.get("audio_url"),
                            language=language,
                            available=True,
                            status="AVAILABLE",
                            message=f"Synthesized via Indic Parler-TTS ({self.model}).",
                        )
                    else:
                        return TTSResult(
                            audio_base64=None,
                            language=language,
                            available=False,
                            status="ERROR",
                            message="Indic Parler-TTS endpoint returned empty audio payload.",
                        )
                else:
                    return TTSResult(
                        audio_base64=None,
                        language=language,
                        available=False,
                        status="ERROR",
                        message=f"Indic Parler-TTS endpoint returned HTTP {resp.status_code}: {resp.text}",
                    )
        except Exception as e:
            return TTSResult(
                audio_base64=None,
                language=language,
                available=False,
                status="ERROR",
                message=f"Indic Parler-TTS synthesis error: {str(e)}",
            )
