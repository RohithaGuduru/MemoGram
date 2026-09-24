import base64
import httpx
from typing import Optional, Dict, Any

from app.core.config import settings
from app.core.logging import get_logger
from app.services.providers.base import (
    STTProvider,
    TTSProvider,
    STTResult,
    TTSResult,
)

logger = get_logger("app.services.providers.bhashini_provider")


class BhashiniProvider(STTProvider, TTSProvider):
    """
    Bhashini / ULCA official REST API integration providing Speech-To-Text (ASR)
    and Text-To-Speech (TTS) for Indian regional languages, particularly
    Northeastern languages (Kokborok, Mizo, Assamese, Bodo, Manipuri).
    """

    DEFAULT_INFERENCE_URL = "https://dhruva-api.bhashini.gov.in/services/inference/pipeline"
    CONFIG_URL = "https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline"

    LANGUAGE_CODES: Dict[str, str] = {
        "as": "as",
        "as-in": "as",
        "brx": "brx",
        "brx-in": "brx",
        "mni": "mni",
        "mni-in": "mni",
        "kokborok": "trp",
        "trp": "trp",
        "trp-in": "trp",
        "mizo": "lus",
        "lus": "lus",
        "lus-in": "lus",
        "khasi": "kha",
        "kha": "kha",
        "kha-in": "kha",
        "hi": "hi",
        "hi-in": "hi",
        "en": "en",
        "en-in": "en",
    }

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

    def __init__(
        self,
        api_key: Optional[str] = None,
        user_id: Optional[str] = None,
        pipeline_id: Optional[str] = None,
        inference_url: Optional[str] = None,
    ):
        self.api_key = api_key or settings.BHASHINI_API_KEY
        self.user_id = user_id or settings.BHASHINI_USER_ID
        self.pipeline_id = pipeline_id or settings.BHASHINI_PIPELINE_ID
        self.inference_url = inference_url or settings.BHASHINI_INFERENCE_URL or self.DEFAULT_INFERENCE_URL

    def is_available(self) -> bool:
        """Returns True if minimum credentials required for Bhashini pipeline are present."""
        return bool(self.api_key and len(self.api_key) > 5 and self.user_id)

    def _normalize_lang_code(self, language: str) -> str:
        code_key = language.lower().strip()
        base = code_key.split("-")[0]
        return self.LANGUAGE_CODES.get(code_key, self.LANGUAGE_CODES.get(base, base))

    def _get_lang_display(self, language: str) -> str:
        base = language.lower().split("-")[0]
        return self.LANGUAGE_NAMES.get(base, language)

    async def transcribe(
        self,
        audio_data: bytes,
        language: str = "trp",
        content_type: str = "audio/wav",
    ) -> STTResult:
        """
        Transcribes audio using Bhashini ASR pipeline for regional languages.
        """
        lang_display = self._get_lang_display(language)
        if not self.is_available():
            logger.info(f"Bhashini STT unavailable: credentials not configured for {lang_display}.")
            return STTResult(
                text="",
                language=language,
                confidence=0.0,
                provider="bhashini_unavailable",
            )

        source_lang = self._normalize_lang_code(language)
        audio_b64 = base64.b64encode(audio_data).decode("utf-8")

        headers = {
            "Authorization": self.api_key,
            "userID": self.user_id,
            "Content-Type": "application/json",
        }

        body = {
            "pipelineTasks": [
                {
                    "taskType": "asr",
                    "config": {
                        "language": {"sourceLanguage": source_lang},
                    },
                }
            ],
            "inputData": {
                "audio": [{"audioContent": audio_b64}],
            },
        }

        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                resp = await client.post(self.inference_url, json=body, headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    task_results = data.get("pipelineResponse", [])
                    for task in task_results:
                        if task.get("taskType") == "asr":
                            outputs = task.get("output", [])
                            if outputs:
                                transcript = outputs[0].get("source", "").strip()
                                return STTResult(
                                    text=transcript,
                                    language=language,
                                    confidence=0.90,
                                    provider="bhashini",
                                )
                logger.warning(f"Bhashini ASR HTTP {resp.status_code}: {resp.text}")
        except Exception as e:
            logger.error(f"Bhashini ASR request exception: {str(e)}")

        return STTResult(
            text="",
            language=language,
            confidence=0.0,
            provider="bhashini_error",
        )

    async def synthesize(self, text: str, language: str = "as") -> TTSResult:
        """
        Synthesizes speech using Bhashini TTS pipeline for regional languages.
        CRITICAL RULE: Never fall back to English/Hindi if regional voice fails.
        """
        lang_display = self._get_lang_display(language)
        if not self.is_available():
            return TTSResult(
                audio_base64=None,
                language=language,
                available=False,
                status="UNAVAILABLE",
                message=f"Bhashini TTS is unavailable for {lang_display}.",
            )

        source_lang = self._normalize_lang_code(language)
        headers = {
            "Authorization": self.api_key,
            "userID": self.user_id,
            "Content-Type": "application/json",
        }

        body = {
            "pipelineTasks": [
                {
                    "taskType": "tts",
                    "config": {
                        "language": {"sourceLanguage": source_lang},
                        "gender": "female",
                    },
                }
            ],
            "inputData": {
                "input": [{"source": text.strip()}],
            },
        }

        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                resp = await client.post(self.inference_url, json=body, headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    task_results = data.get("pipelineResponse", [])
                    for task in task_results:
                        if task.get("taskType") == "tts":
                            audios = task.get("audio", [])
                            if audios:
                                audio_content = audios[0].get("audioContent", "")
                                if audio_content:
                                    return TTSResult(
                                        audio_base64=audio_content,
                                        language=language,
                                        available=True,
                                        status="AVAILABLE",
                                    )
                logger.warning(f"Bhashini TTS HTTP {resp.status_code}: {resp.text}")
        except Exception as e:
            logger.error(f"Bhashini TTS synthesis exception: {str(e)}")

        return TTSResult(
            audio_base64=None,
            language=language,
            available=False,
            status="UNAVAILABLE",
            message=f"Bhashini TTS is unavailable for {lang_display}.",
        )
