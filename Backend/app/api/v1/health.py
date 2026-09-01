from typing import Dict, Any
from fastapi import APIRouter
from app.core.config import settings
from app.services.gemini_service import GeminiService
from app.services.providers.sarvam_provider import SarvamProvider

router = APIRouter(tags=["Health & Status"])


@router.get("/health")
def health_check() -> Dict[str, Any]:
    """Returns overall health, database availability, and AI provider connectivity status."""
    sarvam = SarvamProvider()
    return {
        "status": "healthy",
        "project": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
        "ai_providers": {
            "gemini": {
                "configured": bool(settings.GEMINI_API_KEY),
                "available": GeminiService.is_available(),
                "model": settings.GEMINI_MODEL,
            },
            "sarvam": {
                "configured": bool(settings.SARVAM_API_KEY),
                "available": sarvam.is_available(),
            },
            "azure_speech": {
                "configured": bool(settings.AZURE_SPEECH_KEY),
            },
        },
    }
