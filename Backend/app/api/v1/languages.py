from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.memogram import LanguageCapabilityResponse
from app.services.language_service import LanguageService

router = APIRouter(prefix="/languages", tags=["Languages & Capability Registry"])


@router.get("", response_model=List[LanguageCapabilityResponse])
def list_languages(
    db: Session = Depends(get_db),
):
    """
    Lists all supported languages with independent capabilities:
    text, UI text, STT, translation, TTS, provider mapping, and availability status.
    """
    return LanguageService.list_languages(db)


@router.get("/{code}", response_model=LanguageCapabilityResponse)
def get_language_capability(
    code: str,
    db: Session = Depends(get_db),
):
    """
    Retrieves capability details for a specific language code.
    If TTS is unavailable (e.g. Mizo), explicitly reports 'IN_DEVELOPMENT' status.
    """
    cap = LanguageService.get_language_capability(db, code)
    if not cap:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Language code '{code}' is not registered in Memogram.",
        )
    return cap
