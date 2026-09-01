from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
import statistics
from sqlalchemy.orm import Session

from app.models.performance_metric import PerformanceMetric
from app.models.baseline import Baseline
from app.models.performance_trend import PerformanceTrend
from app.models.game_session import GameSession
from app.models.game import Game
from app.schemas.performance import (
    PerformanceOverviewResponse,
    PerformanceMetricResponse,
    PerformanceHistoryResponse,
    PerformanceHistoryPoint,
)
from app.utils.enums import SessionStatus, GameCategory


class PerformanceService:

    @classmethod
    def get_performance_overview(cls, db: Session, patient_id: str) -> PerformanceOverviewResponse:
        # Fetch all metrics for patient
        metrics = db.query(PerformanceMetric).filter(
            PerformanceMetric.patient_id == patient_id
        ).order_by(PerformanceMetric.created_at.desc()).all()

        total_sessions = len(metrics)
        if total_sessions > 0:
            overall_acc = round(float(statistics.mean(m.accuracy for m in metrics)), 2)
            overall_rt = round(float(statistics.mean(m.average_response_time_ms for m in metrics)), 2)
            overall_comp = round(float(statistics.mean(m.completion_rate for m in metrics)), 2)
        else:
            overall_acc = 0.0
            overall_rt = 0.0
            overall_comp = 0.0

        # Current difficulties per category
        current_diffs = {}
        for cat in GameCategory:
            latest = db.query(PerformanceMetric).filter(
                PerformanceMetric.patient_id == patient_id,
                PerformanceMetric.game_category == cat,
            ).order_by(PerformanceMetric.created_at.desc()).first()
            current_diffs[cat.value] = latest.difficulty if latest else 1

        # Baselines per category
        baselines = db.query(Baseline).filter(Baseline.patient_id == patient_id).all()
        baselines_dict = {
            b.game_category.value: {
                "accuracy": b.baseline_accuracy,
                "response_time_ms": b.baseline_response_time_ms,
                "error_rate": b.baseline_error_rate,
                "sample_count": b.sample_count,
            }
            for b in baselines
        }

        # Trends per category
        trends = db.query(PerformanceTrend).filter(PerformanceTrend.patient_id == patient_id).all()
        trends_dict = {}
        for t in trends:
            trends_dict[f"{t.game_category.value}_{t.metric_name}"] = {
                "trend_direction": t.trend_direction.value,
                "percentage_change": t.percentage_change,
                "recent_avg": t.recent_avg,
                "previous_avg": t.previous_avg,
            }

        recent_metric_schemas = [
            PerformanceMetricResponse.model_validate(m) for m in metrics[:10]
        ]

        return PerformanceOverviewResponse(
            patient_id=patient_id,
            total_sessions_completed=total_sessions,
            overall_average_accuracy=overall_acc,
            overall_average_response_time_ms=overall_rt,
            overall_completion_rate=overall_comp,
            current_difficulty_levels=current_diffs,
            category_baselines=baselines_dict,
            category_trends=trends_dict,
            recent_metrics=recent_metric_schemas,
            recommended_next_activity=None,
        )

    @classmethod
    def get_performance_history(
        cls,
        db: Session,
        patient_id: str,
        timeframe: str = "week",
    ) -> PerformanceHistoryResponse:
        now = datetime.now(timezone.utc)
        if timeframe == "day":
            start_date = now - timedelta(days=1)
        elif timeframe == "month":
            start_date = now - timedelta(days=30)
        else:  # default week
            start_date = now - timedelta(days=7)

        metrics = db.query(PerformanceMetric).filter(
            PerformanceMetric.patient_id == patient_id,
            PerformanceMetric.created_at >= start_date,
        ).order_by(PerformanceMetric.created_at.asc()).all()

        data_points: List[PerformanceHistoryPoint] = []
        for m in metrics:
            game_name = m.game.name if m.game else m.game_category.value
            data_points.append(
                PerformanceHistoryPoint(
                    date=m.created_at.isoformat(),
                    session_id=m.session_id,
                    game_category=m.game_category,
                    game_name=game_name,
                    difficulty=m.difficulty,
                    accuracy=m.accuracy,
                    average_response_time_ms=m.average_response_time_ms,
                    error_rate=m.error_rate,
                    hint_rate=m.hint_rate,
                )
            )

        return PerformanceHistoryResponse(
            patient_id=patient_id,
            timeframe=timeframe,
            data_points=data_points,
        )
