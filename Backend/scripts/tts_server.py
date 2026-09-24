import base64
import io
import logging
import sys
from typing import Optional, Dict
from pydantic import BaseModel, Field
from fastapi import FastAPI, HTTPException, status
import soundfile as sf
import torch
from parler_tts import ParlerTTSForConditionalGeneration
from transformers import AutoTokenizer

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("indic_parler_tts_server")

# =============================================================================
# Language Support Configuration
# =============================================================================
# ai4bharat/indic-parler-tts officially supports 21 languages:
# 20 Indic languages + English.
# Among MEMOGRAM's 8 UI languages, the supported ones are:
# - Assamese (as)
# - Bodo (brx)
# - Manipuri / Meitei (mni)
# - Hindi (hi)
# - English (en)
# Kokborok, Mizo, and Khasi are NOT supported and must be rejected cleanly.
SUPPORTED_LANGUAGES: Dict[str, str] = {
    "as": "Assamese",
    "brx": "Bodo",
    "mni": "Manipuri / Meitei",
    "hi": "Hindi",
    "en": "English",
    "bn": "Bengali",
}

UNSUPPORTED_MEMOGRAM_LANGUAGES = {"kokborok", "trp", "mizo", "lus", "khasi", "kha"}

# =============================================================================
# Hardware Acceleration Detection (Apple Silicon MPS -> CPU fallback)
# =============================================================================
if torch.backends.mps.is_available() and torch.backends.mps.is_built():
    DEVICE = "mps"
    logger.info("Hardware acceleration: Apple Silicon Metal Performance Shaders (MPS) active.")
elif torch.cuda.is_available():
    DEVICE = "cuda:0"
    logger.info("Hardware acceleration: NVIDIA CUDA GPU active.")
else:
    DEVICE = "cpu"
    logger.info("Hardware acceleration: CPU fallback active.")

MODEL_ID = "ai4bharat/indic-parler-tts"
DEFAULT_VOICE_DESCRIPTION = (
    "Sunita speaks slowly in a calm, clear, and friendly voice with very high audio quality and no background noise."
)

app = FastAPI(
    title="Indic Parler-TTS Sidecar Server",
    description="Dedicated local inference server for ai4bharat/indic-parler-tts with MPS acceleration.",
    version="1.0.0",
)

# Global model and tokenizers
model = None
tokenizer = None
description_tokenizer = None
sampling_rate = 24000


def load_model():
    global model, tokenizer, description_tokenizer, sampling_rate
    if model is not None:
        return

    logger.info(f"Loading '{MODEL_ID}' onto device: {DEVICE}...")
    try:
        try:
            model = ParlerTTSForConditionalGeneration.from_pretrained(MODEL_ID, local_files_only=True).to(DEVICE)
            tokenizer = AutoTokenizer.from_pretrained(MODEL_ID, local_files_only=True)
            description_tokenizer = AutoTokenizer.from_pretrained(model.config.text_encoder._name_or_path, local_files_only=True)
        except Exception:
            model = ParlerTTSForConditionalGeneration.from_pretrained(MODEL_ID).to(DEVICE)
            tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)
            description_tokenizer = AutoTokenizer.from_pretrained(model.config.text_encoder._name_or_path)
        sampling_rate = getattr(model.audio_encoder.config, "sampling_rate", 24000)
        logger.info(f"Indic Parler-TTS loaded successfully. Audio sampling rate: {sampling_rate} Hz.")
    except Exception as e:
        logger.error(f"Failed to load '{MODEL_ID}': {e}", exc_info=True)
        raise e


@app.on_event("startup")
def startup_event():
    try:
        load_model()
    except Exception as e:
        logger.warning(f"Model could not be loaded at startup (may require Hugging Face authentication): {e}")


class TTSRequest(BaseModel):
    text: str = Field(..., description="Text to synthesize into speech")
    language: str = Field("as", description="Target language code (e.g., as, brx, mni, hi, en)")
    model: Optional[str] = Field(MODEL_ID, description="Target model ID")
    voice_description: Optional[str] = Field(None, description="Custom prompt controlling speaker acoustics")


class TTSResponse(BaseModel):
    audio_base64: str
    language: str
    sampling_rate: int
    duration_seconds: float
    status: str
    message: Optional[str] = None


@app.get("/health")
def health_check():
    return {
        "status": "HEALTHY",
        "device": DEVICE,
        "model_loaded": model is not None,
        "supported_languages": list(SUPPORTED_LANGUAGES.keys()),
    }


@app.post("/synthesize", response_model=TTSResponse)
async def synthesize_speech(req: TTSRequest):
    norm_lang = req.language.lower().split("-")[0]

    # Clean rejection of unsupported languages (strict security and correctness rule)
    if norm_lang not in SUPPORTED_LANGUAGES:
        lang_name = norm_lang.capitalize()
        if norm_lang in UNSUPPORTED_MEMOGRAM_LANGUAGES:
            lang_name = "Kokborok" if norm_lang in ["kokborok", "trp"] else "Mizo" if norm_lang in ["mizo", "lus"] else "Khasi"
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": "UNSUPPORTED_LANGUAGE",
                "message": f"Indic Parler-TTS does not support '{lang_name}' ({req.language}).",
                "supported_languages": list(SUPPORTED_LANGUAGES.keys()),
            },
        )

    if model is None or tokenizer is None or description_tokenizer is None:
        try:
            load_model()
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Model '{MODEL_ID}' is not loaded. Ensure Hugging Face authentication is configured. Error: {str(e)}",
            )

    text = req.text.strip()
    if not text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot synthesize empty text.",
        )

    desc = req.voice_description or DEFAULT_VOICE_DESCRIPTION

    try:
        prompt_input_ids = tokenizer(text, return_tensors="pt").input_ids.to(DEVICE)
        input_ids = description_tokenizer(desc, return_tensors="pt").input_ids.to(DEVICE)

        with torch.inference_mode():
            generation = model.generate(
                input_ids=input_ids,
                prompt_input_ids=prompt_input_ids,
            )

        audio_arr = generation.cpu().numpy().squeeze()
        if audio_arr.ndim > 1:
            audio_arr = audio_arr[0]

        # Calculate actual non-empty duration
        dur_sec = round(len(audio_arr) / sampling_rate, 2)

        # Write real WAV audio to byte buffer
        buffer = io.BytesIO()
        sf.write(buffer, audio_arr, sampling_rate, format="WAV", subtype="PCM_16")
        wav_bytes = buffer.getvalue()

        # Real Base64 encoding
        audio_b64 = base64.b64encode(wav_bytes).decode("utf-8")

        logger.info(f"Synthesized {dur_sec}s of audio for language '{norm_lang}' ({len(text)} chars).")

        return TTSResponse(
            audio_base64=audio_b64,
            language=req.language,
            sampling_rate=sampling_rate,
            duration_seconds=dur_sec,
            status="AVAILABLE",
            message=f"Synthesized via Indic Parler-TTS on {DEVICE}.",
        )

    except Exception as exc:
        logger.error(f"Inference error during synthesis: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference error: {str(exc)}",
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
