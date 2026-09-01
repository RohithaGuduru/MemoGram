from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session

from app.models.performance_trend import PerformanceTrend
from app.models.performance_metric import PerformanceMetric
from app.utils.enums import GameCategory, TrendDirection
from app.ai.trend import TrendEngine


class TrendService:

    @classmethod
    def recalculate_category_trends(
        cls,
        db: Session,
        patient_id: str,
        game_category: GameCategory,
    ) -> List[PerformanceTrend]:
        """
        Recomputes performance trends for accuracy and response time within a game category.
        """
        metrics = db.query(PerformanceMetric).filter(
            PerformanceMetric.patient_id == patient_id,
            PerformanceMetric.game_category == game_category,
        ).order_by(PerformanceMetric.created_at.asc()).all()

        if not metrics:
            return []

        accuracy_values = [m.accuracy for m in metrics]
        rt_values = [m.average_response_time_ms for m in metrics]

        acc_trend_dict = TrendEngine.calculate_trend(accuracy_values, metric_name="accuracy")
        rt_trend_dict = TrendEngine.calculate_trend(rt_values, metric_name="response_time")

        now = datetime.now(timezone.utc)
        results = []

        for trend_data in [acc_trend_dict, rt_trend_dict]:
            # Update or create trend record
            trend_record = db.query(PerformanceTrend).filter(
                PerformanceTrend.patient_id == patient_id,
                PerformanceTrend.game_category == game_category,
                PerformanceTrend.metric_name == trend_data["metric_name"],
            ).first()

            if trend_record:
                trend_record.previous_avg = trend_data["previous_avg"]
                trend_record.recent_avg = trend_data["recent_avg"]
                trend_record.percentage_change = trend_data["percentage_change"]
                trend_record.trend_direction = trend_data["trend_direction"]
                trend_record.calculated_at = now
            else:
                trend_record = PerformanceTrend(
                    patient_id=patient_id,
                    game_category=game_category,
                    metric_name=trend_data["metric_name"],
                    window_size=trend_data["window_size"],
                    previous_avg=trend_data["previous_avg"],
                    recent_avg=trend_data["recent_avg"],
                    percentage_change=trend_data["percentage_change"],
                    trend_direction=trend_data["trend_direction"],
                    calculated_at=now,
                )
                db.add(trend_record)
            results.append(trend_record)

        return results
