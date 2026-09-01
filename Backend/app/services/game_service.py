from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.game import Game
from app.models.game_session import GameSession
from app.models.game_result import GameResult
from app.models.performance_metric import PerformanceMetric
from app.schemas.game import GameCreate, GameUpdate, GameResponse
from app.schemas.game_session import (
    GameSessionCreate,
    GameSessionResponse,
    GameResultSubmit,
    GameResultResponse,
)
from app.utils.enums import SessionStatus, GameCategory
from app.ai.preprocessing import GameDataPreprocessor
from app.ai.metrics import PerformanceMetricsCalculator
from app.ai.difficulty_engine import DifficultyEngine
from app.ai.insight_engine import InsightEngine
from app.services.baseline_service import BaselineService
from app.services.trend_service import TrendService


class GameService:

    @classmethod
    def list_games(cls, db: Session, category: Optional[GameCategory] = None) -> List[GameResponse]:
        query = db.query(Game).filter(Game.is_active == True)
        if category:
            query = query.filter(Game.category == category)
        games = query.all()
        return [GameResponse.model_validate(g) for g in games]

    @classmethod
    def get_game_by_id(cls, db: Session, game_id: str) -> GameResponse:
        game = db.query(Game).filter(Game.id == game_id).first()
        if not game:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Game not found")
        return GameResponse.model_validate(game)

    @classmethod
    def create_game(cls, db: Session, req: GameCreate) -> GameResponse:
        existing = db.query(Game).filter(Game.code == req.code).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Game code already exists")
        game = Game(
            code=req.code,
            name=req.name,
            category=req.category,
            description=req.description,
            min_difficulty=req.min_difficulty,
            max_difficulty=req.max_difficulty,
            default_config=req.default_config or {},
            metadata_info=req.metadata_info or {},
            is_active=req.is_active,
        )
        db.add(game)
        db.commit()
        db.refresh(game)
        return GameResponse.model_validate(game)

    @classmethod
    def start_session(cls, db: Session, game_id: str, req: GameSessionCreate) -> GameSessionResponse:
        game = db.query(Game).filter((Game.id == game_id) | (Game.code == game_id)).first()
        if not game:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Game not found")

        # Idempotency check on client_session_id
        existing = db.query(GameSession).filter(GameSession.client_session_id == req.client_session_id).first()
        if existing:
            return GameSessionResponse.model_validate(existing)

        session = GameSession(
            client_session_id=req.client_session_id,
            patient_id=req.patient_id,
            game_id=game.id,
            game_category=game.category,
            difficulty=req.difficulty,
            device_id=req.device_id,
            started_at=req.started_at or datetime.now(timezone.utc),
            status=SessionStatus.IN_PROGRESS,
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        return GameSessionResponse.model_validate(session)

    @classmethod
    def submit_session_result(
        cls,
        db: Session,
        session_id: str,
        req: GameResultSubmit,
    ) -> GameResultResponse:
        # Look up by either server primary key UUID or client session UUID
        session = db.query(GameSession).filter(
            (GameSession.id == session_id) | (GameSession.client_session_id == session_id)
        ).first()
        if not session:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Game session not found")

        # IDEMPOTENCY CHECK: If already submitted, return existing record
        existing_result = db.query(GameResult).filter(GameResult.session_id == session.id).first()
        if existing_result:
            metric = db.query(PerformanceMetric).filter(PerformanceMetric.session_id == session.id).first()
            metric_dict = {
                "accuracy": metric.accuracy,
                "error_rate": metric.error_rate,
                "average_response_time_ms": metric.average_response_time_ms,
                "median_response_time_ms": metric.median_response_time_ms,
                "hint_rate": metric.hint_rate,
                "completion_rate": metric.completion_rate,
            } if metric else None

            return GameResultResponse(
                result_id=existing_result.id,
                session_id=session.id,
                patient_id=session.patient_id,
                total_questions=existing_result.total_questions,
                correct_answers=existing_result.correct_answers,
                incorrect_answers=existing_result.incorrect_answers,
                errors_count=existing_result.errors_count,
                hints_used=existing_result.hints_used,
                total_time_ms=existing_result.total_time_ms,
                submitted_at=existing_result.submitted_at,
                metrics=metric_dict,
                baseline_comparison=None,
                difficulty_recommendation=None,
            )

        # 1. AI Preprocessing
        preprocessed = GameDataPreprocessor.sanitize_raw_result(req.model_dump())

        # 2. AI Metrics Calculation
        metrics = PerformanceMetricsCalculator.calculate_session_metrics(preprocessed)

        # 3. Store GameResult
        now = datetime.now(timezone.utc)
        result = GameResult(
            session_id=session.id,
            patient_id=session.patient_id,
            total_questions=preprocessed["total_questions"],
            correct_answers=preprocessed["correct_answers"],
            incorrect_answers=preprocessed["incorrect_answers"],
            errors_count=preprocessed["errors_count"],
            attempts_count=preprocessed["attempts_count"],
            hints_used=preprocessed["hints_used"],
            total_time_ms=preprocessed["total_time_ms"],
            response_times=preprocessed["response_times"],
            raw_events=preprocessed["raw_events"],
            submitted_at=now,
        )
        db.add(result)

        # 4. Store PerformanceMetric
        perf_metric = PerformanceMetric(
            session_id=session.id,
            patient_id=session.patient_id,
            game_id=session.game_id,
            game_category=session.game_category,
            difficulty=session.difficulty,
            accuracy=metrics["accuracy"],
            error_rate=metrics["error_rate"],
            average_response_time_ms=metrics["average_response_time_ms"],
            median_response_time_ms=metrics["median_response_time_ms"],
            hint_rate=metrics["hint_rate"],
            completion_rate=metrics["completion_rate"],
            attempts=metrics["attempts"],
            created_at=now,
        )
        db.add(perf_metric)

        # 5. Mark Session Completed
        session.status = SessionStatus.COMPLETED
        session.completed_at = req.completed_at or now

        db.flush()

        # 6. Baseline Engine Integration
        baseline_comp = BaselineService.process_session_for_baseline(
            db=db,
            patient_id=session.patient_id,
            game_category=session.game_category,
            difficulty=session.difficulty,
            metric_data=metrics,
        )

        # 7. Trend Engine Integration
        TrendService.recalculate_category_trends(
            db=db,
            patient_id=session.patient_id,
            game_category=session.game_category,
        )

        # 8. Difficulty Engine Evaluation
        recent_records = db.query(PerformanceMetric).filter(
            PerformanceMetric.patient_id == session.patient_id,
            PerformanceMetric.game_category == session.game_category,
        ).order_by(PerformanceMetric.created_at.asc()).all()

        recent_metric_dicts = [
            {
                "accuracy": r.accuracy,
                "error_rate": r.error_rate,
                "hint_rate": r.hint_rate,
                "completion_rate": r.completion_rate,
            }
            for r in recent_records
        ]

        diff_rec = DifficultyEngine.evaluate_difficulty(
            current_difficulty=session.difficulty,
            recent_session_metrics=recent_metric_dicts,
            min_difficulty=session.game.min_difficulty if session.game else 1,
            max_difficulty=session.game.max_difficulty if session.game else 5,
        )

        db.commit()
        db.refresh(result)

        return GameResultResponse(
            result_id=result.id,
            session_id=session.id,
            patient_id=session.patient_id,
            total_questions=result.total_questions,
            correct_answers=result.correct_answers,
            incorrect_answers=result.incorrect_answers,
            errors_count=result.errors_count,
            hints_used=result.hints_used,
            total_time_ms=result.total_time_ms,
            submitted_at=result.submitted_at,
            metrics=metrics,
            baseline_comparison=baseline_comp,
            difficulty_recommendation=diff_rec,
        )
