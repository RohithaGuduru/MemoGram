from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session

from app.models.patient import Patient
from app.models.game import Game
from app.models.game_session import GameSession
from app.models.recommendation import Recommendation
from app.models.performance_metric import PerformanceMetric
from app.schemas.recommendation import (
    RecommendationResponse,
    DailyActivityPlanResponse,
    DailyActivityItem,
)
from app.ai.game_recommender import GameRecommender
from app.utils.enums import GameCategory


class RecommendationService:

    @classmethod
    def get_next_recommendation(cls, db: Session, patient_id: str) -> RecommendationResponse:
        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        if not patient:
            raise ValueError("Patient not found")

        active_games = db.query(Game).filter(Game.is_active == True).all()
        active_games_dict = [
            {
                "id": g.id,
                "code": g.code,
                "name": g.name,
                "category": g.category,
                "min_difficulty": g.min_difficulty,
                "max_difficulty": g.max_difficulty,
                "is_active": g.is_active,
            }
            for g in active_games
        ]

        recent_sessions = db.query(GameSession).filter(
            GameSession.patient_id == patient_id
        ).order_by(GameSession.started_at.asc()).all()

        recent_sessions_dict = [
            {"game_category": s.game_category, "difficulty": s.difficulty}
            for s in recent_sessions
        ]

        # Fetch current difficulty levels
        current_diffs = {}
        for cat in GameCategory:
            latest = db.query(PerformanceMetric).filter(
                PerformanceMetric.patient_id == patient_id,
                PerformanceMetric.game_category == cat,
            ).order_by(PerformanceMetric.created_at.desc()).first()
            if latest:
                current_diffs[cat.value] = latest.difficulty

        rec_dict = GameRecommender.recommend_next_activity(
            active_games=active_games_dict,
            recent_sessions=recent_sessions_dict,
            patient_interests=patient.interests or [],
            category_difficulties=current_diffs,
        )

        now = datetime.now(timezone.utc)
        # Store recommendation record
        rec_model = Recommendation(
            patient_id=patient_id,
            recommended_game_id=rec_dict["game_id"],
            game_category=rec_dict["game_category"],
            target_difficulty=rec_dict["target_difficulty"],
            reason=rec_dict["reason"],
            confidence=rec_dict["confidence"],
            plan_date=now.date(),
            is_consumed=False,
            created_at=now,
        )
        db.add(rec_model)
        db.commit()
        db.refresh(rec_model)

        return RecommendationResponse(
            id=rec_model.id,
            patient_id=rec_model.patient_id,
            recommended_game_id=rec_model.recommended_game_id,
            game_name=rec_dict["game_name"],
            game_code=rec_dict["game_code"],
            game_category=rec_model.game_category,
            target_difficulty=rec_model.target_difficulty,
            reason=rec_model.reason,
            confidence=rec_model.confidence,
            plan_date=rec_model.plan_date,
            is_consumed=rec_model.is_consumed,
            created_at=rec_model.created_at,
        )

    @classmethod
    def get_daily_activity_plan(cls, db: Session, patient_id: str) -> DailyActivityPlanResponse:
        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        if not patient:
            raise ValueError("Patient not found")

        active_games = db.query(Game).filter(Game.is_active == True).all()
        active_games_dict = [
            {
                "id": g.id,
                "code": g.code,
                "name": g.name,
                "category": g.category,
                "min_difficulty": g.min_difficulty,
                "max_difficulty": g.max_difficulty,
                "is_active": g.is_active,
            }
            for g in active_games
        ]

        recent_sessions = db.query(GameSession).filter(
            GameSession.patient_id == patient_id
        ).order_by(GameSession.started_at.asc()).all()

        recent_sessions_dict = [
            {"game_category": s.game_category, "difficulty": s.difficulty}
            for s in recent_sessions
        ]

        plan_dict = GameRecommender.generate_daily_plan(
            patient_id=patient_id,
            active_games=active_games_dict,
            recent_sessions=recent_sessions_dict,
            patient_interests=patient.interests or [],
            preferred_language=patient.preferred_language,
        )

        activities = [
            DailyActivityItem(
                game_id=a["game_id"],
                game_name=a["game_name"],
                game_code=a["game_code"],
                type=a["type"],
                difficulty=a["difficulty"],
                reason=a["reason"],
                estimated_duration_minutes=a["estimated_duration_minutes"],
                is_completed=a["is_completed"],
            )
            for a in plan_dict["activities"]
        ]

        return DailyActivityPlanResponse(
            patient_id=patient_id,
            date=plan_dict["date"],
            greeting=plan_dict["greeting"],
            activities=activities,
            daily_tip=plan_dict.get("daily_tip"),
        )
