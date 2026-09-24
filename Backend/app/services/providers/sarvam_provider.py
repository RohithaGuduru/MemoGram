import base64
import httpx
from typing import Optional

from app.core.config import settings
from app.services.providers.base import (
    STTProvider,
    TranslationProvider,
    TTSProvider,
    STTResult,
    TranslationResult,
    TTSResult,
)


class SarvamProvider(STTProvider, TranslationProvider, TTSProvider):
    """
    Sarvam AI integration providing Speech-To-Text (Saaras),
    Translation (Mayura), and Regional Speech Synthesis (Bulbul).
    """

    BASE_URL = "https://api.sarvam.ai"

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.SARVAM_API_KEY

    def is_available(self) -> bool:
        return bool(self.api_key and len(self.api_key) > 5)

    LANGUAGE_MAP = {
        "as": "as-IN",
        "brx": "brx-IN",
        "mni": "mni-IN",
        "hi": "hi-IN",
        "en": "en-IN",
    }

    def supports_language(self, language: str) -> bool:
        norm = language.lower().split("-")[0]
        return norm in self.LANGUAGE_MAP

    def _normalize_lang(self, language: str) -> str:
        lang_lower = language.lower()
        base = lang_lower.split("-")[0]
        return self.LANGUAGE_MAP.get(base, language if "-" in language else f"{base}-IN")

    async def transcribe(
        self,
        audio_data: bytes,
        language: str = "hi-IN",
        content_type: str = "audio/wav",
    ) -> STTResult:
        if not self.supports_language(language):
            return STTResult(
                text="",
                language=language,
                confidence=0.0,
                provider="sarvam_unsupported",
            )

        if not self.is_available():
            return STTResult(
                text="",
                language=language,
                confidence=0.0,
                provider="sarvam_unavailable",
            )

        target_lang = self._normalize_lang(language)
        ext = "webm" if "webm" in (content_type or "") else "mp4" if "mp4" in (content_type or "") else "wav"
        filename = f"audio.{ext}"

        # Sarvam Saaras v3 integration (with saaras:v2 fallback if needed)
        for model_name in ["saaras:v3", "saaras:v2"]:
            try:
                async with httpx.AsyncClient(timeout=15.0) as client:
                    files = {"file": (filename, audio_data, content_type or "audio/wav")}
                    data = {"language_code": target_lang, "model": model_name}
                    headers = {"api-subscription-key": self.api_key}
                    resp = await client.post(
                        f"{self.BASE_URL}/speech-to-text",
                        files=files,
                        data=data,
                        headers=headers,
                    )
                    if resp.status_code == 200:
                        payload = resp.json()
                        transcript = payload.get("transcript", "").strip()
                        return STTResult(
                            text=transcript,
                            language=language,
                            confidence=payload.get("confidence", 0.95),
                            provider="sarvam",
                        )
            except Exception:
                continue

        return STTResult(
            text="",
            language=language,
            confidence=0.0,
            provider="sarvam_error",
        )

    async def translate(self, text: str, source_lang: str, target_lang: str) -> TranslationResult:
        if not self.is_available():
            return TranslationResult(
                translated_text=text,
                source_language=source_lang,
                target_language=target_lang,
                provider="sarvam_mock",
            )

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                headers = {
                    "api-subscription-key": self.api_key,
                    "Content-Type": "application/json",
                }
                body = {
                    "input": text,
                    "source_language_code": source_lang,
                    "target_language_code": target_lang,
                    "mode": "formal",
                }
                resp = await client.post(f"{self.BASE_URL}/translate", json=body, headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    return TranslationResult(
                        translated_text=data.get("translated_text", text),
                        source_language=source_lang,
                        target_language=target_lang,
                        provider="sarvam",
                    )
        except Exception:
            pass

        return TranslationResult(
            translated_text=text,
            source_language=source_lang,
            target_language=target_lang,
            provider="sarvam_fallback",
        )

    async def synthesize(self, text: str, language: str = "hi-IN") -> TTSResult:
        # STRICT BOUNDARY: Sarvam TTS is used ONLY for Hindi and English.
        norm_code = language.lower().split("-")[0]
        if norm_code not in ["hi", "en"]:
            return TTSResult(
                audio_base64=None,
                language=language,
                available=False,
                status="UNAVAILABLE",
                message=f"Sarvam TTS does not support regional language '{language}'.",
            )

        if not self.is_available():
            return TTSResult(
                audio_base64=None,
                language=language,
                available=False,
                status="UNAVAILABLE",
                message="Sarvam API key is not configured.",
            )

        try:
            target_lang = "hi-IN" if norm_code == "hi" else "en-IN"
            async with httpx.AsyncClient(timeout=15.0) as client:
                headers = {
                    "api-subscription-key": self.api_key,
                    "Content-Type": "application/json",
                }
                body = {
                    "inputs": [text.strip()],
                    "target_language_code": target_lang,
                    "speaker": "meera",
                    "model": "bulbul:v1",
                    "enable_preprocessing": True,
                }
                resp = await client.post(f"{self.BASE_URL}/text-to-speech", json=body, headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    audios = data.get("audios", [])
                    if audios:
                        return TTSResult(
                            audio_base64=audios[0],
                            language=language,
                            available=True,
                            status="AVAILABLE",
                        )
        except Exception as e:
            return TTSResult(
                audio_base64=None,
                language=language,
                available=False,
                status="ERROR",
                message=f"Sarvam TTS synthesis error: {str(e)}",
            )

        return TTSResult(
            audio_base64=None,
            language=language,
            available=False,
            status="ERROR",
            message="No audio generated from Sarvam TTS.",
        )


# Explicit TTS Provider Alias
SarvamTTSProvider = SarvamProvider
