from typing import Any, Dict, List, Optional
import statistics


class BaselineEngine:
    """
    Patient-Specific Baseline Engine.
    
    Principles:
    1. Baselines are established for an individual patient per game category & difficulty.
    2. Compares a patient ONLY against their own previous performance.
    3. Initial baseline is established using the first 5 comparable completed sessions.
    4. Subsequent updates use exponential moving average (alpha=0.15) to prevent a single
       atypical session from disproportionately altering the baseline.
    """

    INITIAL_SAMPLE_THRESHOLD = 5
    UPDATE_ALPHA = 0.15  # Weight given to the newest session when updating existing baseline

    @classmethod
    def calculate_initial_baseline(
        cls,
        past_session_metrics: List[Dict[str, float]],
    ) -> Optional[Dict[str, float]]:
        """
        Calculates the initial baseline when at least 5 completed sessions are available.
        """
        if len(past_session_metrics) < cls.INITIAL_SAMPLE_THRESHOLD:
            return None

        # Take first 5 sessions
        samples = past_session_metrics[:cls.INITIAL_SAMPLE_THRESHOLD]

        avg_accuracy = statistics.mean(s["accuracy"] for s in samples)
        avg_rt = statistics.mean(s["average_response_time_ms"] for s in samples)
        avg_error = statistics.mean(s["error_rate"] for s in samples)
        avg_hint = statistics.mean(s["hint_rate"] for s in samples)
        avg_comp = statistics.mean(s.get("completion_rate", 100.0) for s in samples)

        return {
            "baseline_accuracy": round(avg_accuracy, 2),
            "baseline_response_time_ms": round(avg_rt, 2),
            "baseline_error_rate": round(avg_error, 2),
            "baseline_hint_rate": round(avg_hint, 2),
            "baseline_completion_rate": round(avg_comp, 2),
            "sample_count": len(samples),
        }

    @classmethod
    def update_baseline_gradual(
        cls,
        current_baseline: Dict[str, float],
        new_metric: Dict[str, float],
    ) -> Dict[str, float]:
        """
        Gradually updates the patient's baseline using exponential moving average.
        """
        alpha = cls.UPDATE_ALPHA

        updated_acc = (1 - alpha) * current_baseline["baseline_accuracy"] + alpha * new_metric["accuracy"]
        updated_rt = (1 - alpha) * current_baseline["baseline_response_time_ms"] + alpha * new_metric["average_response_time_ms"]
        updated_err = (1 - alpha) * current_baseline["baseline_error_rate"] + alpha * new_metric["error_rate"]
        updated_hint = (1 - alpha) * current_baseline["baseline_hint_rate"] + alpha * new_metric["hint_rate"]
        updated_comp = (1 - alpha) * current_baseline.get("baseline_completion_rate", 100.0) + alpha * new_metric.get("completion_rate", 100.0)
        new_count = int(current_baseline.get("sample_count", 5)) + 1

        return {
            "baseline_accuracy": round(updated_acc, 2),
            "baseline_response_time_ms": round(updated_rt, 2),
            "baseline_error_rate": round(updated_err, 2),
            "baseline_hint_rate": round(updated_hint, 2),
            "baseline_completion_rate": round(updated_comp, 2),
            "sample_count": new_count,
        }

    @classmethod
    def compare_with_baseline(
        cls,
        current_val: float,
        baseline_val: float,
        metric_name: str = "accuracy",
    ) -> Dict[str, Any]:
        """
        Compares current session metric against patient baseline.
        Interprets direction appropriately (e.g. For response time & error rate, lower is better).
        """
        change = round(current_val - baseline_val, 2)
        percentage_change = round(((current_val - baseline_val) / max(baseline_val, 0.001)) * 100.0, 2)

        # Determine direction based on metric semantics
        # For accuracy & completion rate: higher is better
        # For error_rate & response_time: lower is better
        lower_is_better = metric_name in ["response_time", "error_rate", "average_response_time_ms", "hint_rate"]

        if abs(percentage_change) < 3.0:
            direction = "stable"
        elif lower_is_better:
            direction = "improving" if change < 0 else "declining"
        else:
            direction = "improving" if change > 0 else "declining"

        return {
            "metric": metric_name,
            "current": current_val,
            "baseline": baseline_val,
            "change": change,
            "percentage_change": percentage_change,
            "direction": direction,
        }
