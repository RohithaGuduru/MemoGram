from typing import Dict, Any, List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.game_session import GameResultSubmit, GameResultResponse
from app.services.game_service import GameService

router = APIRouter(prefix="/game-events", tags=["Game Events Telemetry"])


@router.post("/sessions/{session_id}/events", response_model=GameResultResponse)
def record_raw_game_events(
    session_id: str,
    req: GameResultSubmit,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Submits structured raw gameplay event telemetry:
    start_time, end_time, question count, correct, incorrect, attempts, hints, response_times, and interaction events.
    """
    return GameService.submit_session_result(db, session_id, req)
