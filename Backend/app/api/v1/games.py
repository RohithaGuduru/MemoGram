from typing import List, Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.game import GameCreate, GameResponse
from app.schemas.game_session import (
    GameSessionCreate,
    GameSessionResponse,
    GameResultSubmit,
    GameResultResponse,
)
from app.schemas.memogram import GameContentGenerateRequest, GameContentGenerateResponse
from app.services.game_service import GameService
from app.services.game_content_service import GameContentService
from app.core.dependencies import get_current_user, require_admin
from app.models.user import User
from app.utils.enums import GameCategory

router = APIRouter(tags=["Games & Sessions"])


@router.get("/games", response_model=List[GameResponse])
def list_games(
    category: Optional[GameCategory] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Lists available active games in the platform catalog."""
    return GameService.list_games(db, category)


@router.get("/games/{id}", response_model=GameResponse)
def get_game(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieves full configuration and metadata for a specific game."""
    return GameService.get_game_by_id(db, id)


@router.post("/games", response_model=GameResponse, status_code=status.HTTP_201_CREATED)
def create_game_catalog_item(
    req: GameCreate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Adds a new game definition to the catalog (Admin only)."""
    return GameService.create_game(db, req)


@router.post("/games/content/generate", response_model=GameContentGenerateResponse)
def generate_game_content(
    req: GameContentGenerateRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Generates dynamic variations of questions, shopping lists, and cultural memory prompts via Gemini.
    CRITICAL RULE: Scoring, correctness, and difficulty calculations remain 100% deterministic and backend-controlled.
    """
    return GameContentService.generate_game_content(req)


@router.post("/games/{id}/sessions", response_model=GameSessionResponse, status_code=status.HTTP_201_CREATED)
def start_game_session(
    id: str,
    req: GameSessionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Initializes a new game session with client UUID tracking."""
    return GameService.start_session(db, id, req)


@router.post("/games/sessions/{id}/result", response_model=GameResultResponse)
def submit_game_session_result(
    id: str,
    req: GameResultSubmit,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Submits raw game telemetry for completed session.
    Idempotent: Re-submitting the same session result returns existing metrics without duplication.
    Triggers AI preprocessing, metric evaluation, baseline updates, and difficulty adaptation.
    """
    return GameService.submit_session_result(db, id, req)
