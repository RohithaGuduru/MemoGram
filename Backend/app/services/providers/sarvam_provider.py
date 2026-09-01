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

    async def transcribe(self, audio_data: bytes, language: str = "hi-IN") -> STTResult:
        if not self.is_available():
            return STTResult(
                text="Transcribed audio simulation (Sarvam API key not configured).",
                language=language,
                confidence=0.9,
                provider="sarvam_mock",
            )

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                files = {"file": ("audio.wav", audio_data, "audio/wav")}
                data = {"language_code": language, "model": "saaras:v1"}
                headers = {"api-subscription-key": self.api_key}
                resp = await client.post(f"{self.BASE_URL}/speech-to-text", files=files, data=data, headers=headers)
                if resp.status_code == 200:
                    payload = resp.json()
                    return STTResult(
                        text=payload.get("transcript", ""),
                        language=language,
                        confidence=payload.get("confidence", 0.95),
                        provider="sarvam",
                    )
        except Exception:
            pass

        return STTResult(
            text="Could not transcribe audio via Sarvam.",
            language=language,
            confidence=0.5,
            provider="sarvam_fallback",
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
        if not self.is_available():
            return TTSResult(
                audio_base64=None,
                language=language,
                available=False,
                status="UNAVAILABLE",
                message="Sarvam API key is not configured.",
            )

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                headers = {
                    "api-subscription-key": self.api_key,
                    "Content-Type": "application/json",
                }
                target_lang = language if "-" in language else f"{language}-IN"
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
