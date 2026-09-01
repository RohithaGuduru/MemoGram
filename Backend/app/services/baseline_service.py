from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session

from app.models.baseline import Baseline
from app.models.performance_metric import PerformanceMetric
from app.utils.enums import GameCategory
from app.ai.baseline import BaselineEngine


class BaselineService:

    @classmethod
    def get_baseline_for_category(
        cls,
        db: Session,
        patient_id: str,
        game_category: GameCategory,
        difficulty: int = 1,
    ) -> Optional[Baseline]:
        return db.query(Baseline).filter(
            Baseline.patient_id == patient_id,
            Baseline.game_category == game_category,
            Baseline.difficulty_level == difficulty,
        ).first()

    @classmethod
    def process_session_for_baseline(
        cls,
        db: Session,
        patient_id: str,
        game_category: GameCategory,
        difficulty: int,
        metric_data: Dict[str, float],
    ) -> Optional[Dict[str, Any]]:
        """
        Integrates a completed session into patient baseline tracking.
        If baseline exists -> gradually updates with alpha EMA.
        If baseline does not exist -> checks if 5 sessions have been completed to bootstrap initial baseline.
        Returns baseline comparison dictionary.
        """
        existing_baseline = cls.get_baseline_for_category(db, patient_id, game_category, difficulty)
        now = datetime.now(timezone.utc)

        if existing_baseline:
            # Baseline exists -> compare current performance with established baseline
            comparison = BaselineEngine.compare_with_baseline(
                current_val=metric_data["accuracy"],
                baseline_val=existing_baseline.baseline_accuracy,
                metric_name="accuracy",
            )

            # Update baseline gradually
            updated = BaselineEngine.update_baseline_gradual(
                current_baseline={
                    "baseline_accuracy": existing_baseline.baseline_accuracy,
                    "baseline_response_time_ms": existing_baseline.baseline_response_time_ms,
                    "baseline_error_rate": existing_baseline.baseline_error_rate,
                    "baseline_hint_rate": existing_baseline.baseline_hint_rate,
                    "baseline_completion_rate": existing_baseline.baseline_completion_rate,
                    "sample_count": existing_baseline.sample_count,
                },
                new_metric=metric_data,
            )
            existing_baseline.baseline_accuracy = updated["baseline_accuracy"]
            existing_baseline.baseline_response_time_ms = updated["baseline_response_time_ms"]
            existing_baseline.baseline_error_rate = updated["baseline_error_rate"]
            existing_baseline.baseline_hint_rate = updated["baseline_hint_rate"]
            existing_baseline.baseline_completion_rate = updated["baseline_completion_rate"]
            existing_baseline.sample_count = updated["sample_count"]
            existing_baseline.last_updated_at = now

            return comparison
        else:
            # Baseline does not exist -> query previous sessions of same category & difficulty
            historical_metrics = db.query(PerformanceMetric).filter(
                PerformanceMetric.patient_id == patient_id,
                PerformanceMetric.game_category == game_category,
                PerformanceMetric.difficulty == difficulty,
            ).order_by(PerformanceMetric.created_at.asc()).all()

            metric_dicts = [
                {
                    "accuracy": m.accuracy,
                    "average_response_time_ms": m.average_response_time_ms,
                    "error_rate": m.error_rate,
                    "hint_rate": m.hint_rate,
                    "completion_rate": m.completion_rate,
                }
                for m in historical_metrics
            ]

            initial_baseline_dict = BaselineEngine.calculate_initial_baseline(metric_dicts)
            if initial_baseline_dict:
                new_baseline = Baseline(
                    patient_id=patient_id,
                    game_category=game_category,
                    difficulty_level=difficulty,
                    baseline_accuracy=initial_baseline_dict["baseline_accuracy"],
                    baseline_response_time_ms=initial_baseline_dict["baseline_response_time_ms"],
                    baseline_error_rate=initial_baseline_dict["baseline_error_rate"],
                    baseline_hint_rate=initial_baseline_dict["baseline_hint_rate"],
                    baseline_completion_rate=initial_baseline_dict["baseline_completion_rate"],
                    sample_count=initial_baseline_dict["sample_count"],
                    last_updated_at=now,
                )
                db.add(new_baseline)
                return BaselineEngine.compare_with_baseline(
                    current_val=metric_data["accuracy"],
                    baseline_val=new_baseline.baseline_accuracy,
                    metric_name="accuracy",
                )

        return None
