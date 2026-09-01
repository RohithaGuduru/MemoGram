from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.dependencies import get_current_active_user
from app.models.user import User
from app.models.patient import Patient
from app.models.game import Game
from app.models.performance_metric import PerformanceMetric
from app.ai.difficulty_engine import DifficultyEngine
from app.schemas.recommendation import DifficultyRecommendationResult

router = APIRouter(prefix="/adaptive", tags=["Adaptive Difficulty Engine"])


@router.get("/evaluate/{patient_id}/{game_id}", response_model=DifficultyRecommendationResult)
@router.post("/evaluate/{patient_id}/{game_id}", response_model=DifficultyRecommendationResult)
def evaluate_adaptive_difficulty(
    patient_id: str,
    game_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Evaluates patient raw performance metrics for a specific game and returns
    a deterministic, explainable difficulty recommendation (Increase, Maintain, Decrease).
    """
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found",
        )

    game = db.query(Game).filter(Game.id == game_id).first()
    if not game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Game not found",
        )

    # Fetch recent metrics
    metrics = db.query(PerformanceMetric).filter(
        PerformanceMetric.patient_id == patient.id,
        PerformanceMetric.game_id == game.id,
    ).order_by(PerformanceMetric.created_at.asc()).all()

    current_difficulty = metrics[-1].difficulty if metrics else game.min_difficulty
    metrics_data = [
        {
            "accuracy": m.accuracy,
            "error_rate": m.error_rate,
            "hint_rate": m.hint_rate,
            "completion_rate": m.completion_rate,
            "average_response_time_ms": m.average_response_time_ms,
        }
        for m in metrics
    ]

    res = DifficultyEngine.evaluate_difficulty(
        current_difficulty=current_difficulty,
        recent_session_metrics=metrics_data,
        min_difficulty=game.min_difficulty,
        max_difficulty=game.max_difficulty,
    )

    return DifficultyRecommendationResult(
        current_difficulty=res["current_difficulty"],
        recommended_difficulty=res["recommended_difficulty"],
        action=res["action"].value if hasattr(res["action"], "value") else str(res["action"]),
        reason=res["reason"],
        confidence=res["confidence"],
    )
