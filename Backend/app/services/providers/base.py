from abc import ABC, abstractmethod
from typing import Optional, Dict, Any
from pydantic import BaseModel


class TTSResult(BaseModel):
    audio_base64: Optional[str] = None
    audio_url: Optional[str] = None
    content_type: str = "audio/wav"
    language: str
    available: bool
    status: str  # "AVAILABLE", "IN_DEVELOPMENT", "ERROR", "UNAVAILABLE"
    message: Optional[str] = None


class STTResult(BaseModel):
    text: str
    language: str
    confidence: float = 1.0
    provider: str


class TranslationResult(BaseModel):
    translated_text: str
    source_language: str
    target_language: str
    provider: str


class STTProvider(ABC):
    @abstractmethod
    async def transcribe(self, audio_data: bytes, language: str) -> STTResult:
        pass


class TranslationProvider(ABC):
    @abstractmethod
    async def translate(self, text: str, source_lang: str, target_lang: str) -> TranslationResult:
        pass


class TTSProvider(ABC):
    @abstractmethod
    async def synthesize(self, text: str, language: str) -> TTSResult:
        pass
