from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.dependencies import get_current_active_user
from app.models.user import User
from app.schemas.memogram import VoiceProcessRequest, VoiceProcessResponse
from app.services.voice_gateway_service import VoiceGatewayService

router = APIRouter(prefix="/voice", tags=["Voice Assistant Gateway"])

gateway_service = VoiceGatewayService()


@router.post("/process", response_model=VoiceProcessResponse)
async def process_voice_interaction(
    req: VoiceProcessRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Mobile-first Voice Pipeline:
    Patient Voice/Text -> STT -> Intent Classification -> Database Tool Execution ->
    Primary-Language Response -> TTS Router (or IN_DEVELOPMENT status).
    """
    return await gateway_service.process_voice(db, req)
