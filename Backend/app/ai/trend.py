from typing import Any, Dict, List, Optional
import statistics

from app.utils.enums import TrendDirection


class TrendEngine:
    """
    Computes performance trends across sliding-window session groups.
    
    Principles:
    - Avoids overreacting to single sessions.
    - Compares recent window (e.g. last 3 sessions) with previous window (preceding 3 sessions).
    - Categorizes into: IMPROVING, STABLE, DECLINING, INSUFFICIENT_DATA.
    """

    WINDOW_SIZE = 3
    TREND_THRESHOLD_PERCENT = 4.0  # At least 4% delta required to classify as improving or declining

    @classmethod
    def calculate_trend(
        cls,
        session_metric_values: List[float],
        metric_name: str = "accuracy",
        window_size: int = WINDOW_SIZE,
    ) -> Dict[str, Any]:
        """
        Calculates trend from a chronological list of metric values (oldest to newest).
        """
        min_required = window_size * 2
        if len(session_metric_values) < min_required:
            # If not enough for 2 windows, check if at least window_size exists
            if len(session_metric_values) >= window_size:
                recent_avg = round(float(statistics.mean(session_metric_values[-window_size:])), 2)
                return {
                    "metric_name": metric_name,
                    "window_size": window_size,
                    "previous_avg": recent_avg,
                    "recent_avg": recent_avg,
                    "percentage_change": 0.0,
                    "trend_direction": TrendDirection.STABLE,
                }
            return {
                "metric_name": metric_name,
                "window_size": window_size,
                "previous_avg": 0.0,
                "recent_avg": round(float(statistics.mean(session_metric_values)), 2) if session_metric_values else 0.0,
                "percentage_change": 0.0,
                "trend_direction": TrendDirection.INSUFFICIENT_DATA,
            }

        # Divide into previous window and recent window
        previous_window = session_metric_values[-(window_size * 2):-window_size]
        recent_window = session_metric_values[-window_size:]

        previous_avg = round(float(statistics.mean(previous_window)), 2)
        recent_avg = round(float(statistics.mean(recent_window)), 2)

        if previous_avg == 0:
            percentage_change = 0.0
        else:
            percentage_change = round(((recent_avg - previous_avg) / previous_avg) * 100.0, 2)

        lower_is_better = metric_name in ["response_time", "error_rate", "average_response_time_ms", "hint_rate"]

        if abs(percentage_change) < cls.TREND_THRESHOLD_PERCENT:
            direction = TrendDirection.STABLE
        elif lower_is_better:
            direction = TrendDirection.IMPROVING if percentage_change < -cls.TREND_THRESHOLD_PERCENT else TrendDirection.DECLINING
        else:
            direction = TrendDirection.IMPROVING if percentage_change > cls.TREND_THRESHOLD_PERCENT else TrendDirection.DECLINING

        return {
            "metric_name": metric_name,
            "window_size": window_size,
            "previous_avg": previous_avg,
            "recent_avg": recent_avg,
            "percentage_change": percentage_change,
            "trend_direction": direction,
        }
