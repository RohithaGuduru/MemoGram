from typing import Any, Dict, List, Optional
import statistics


class PerformanceMetricsCalculator:
    """
    Computes activity performance metrics from sanitized game telemetry.
    Strictly focuses on activity metrics (Accuracy, Error Rate, Response Times, Hint Rate, Completion Rate).
    """

    @classmethod
    def calculate_session_metrics(cls, preprocessed_data: Dict[str, Any]) -> Dict[str, float]:
        total_q = preprocessed_data["total_questions"]
        correct = preprocessed_data["correct_answers"]
        incorrect = preprocessed_data["incorrect_answers"]
        hints = preprocessed_data["hints_used"]
        response_times: List[int] = preprocessed_data.get("response_times", [])

        # Accuracy percentage (0.0 to 100.0%)
        accuracy = round((correct / total_q) * 100.0, 2) if total_q > 0 else 0.0

        # Error rate percentage (0.0 to 100.0%)
        error_rate = round((incorrect / total_q) * 100.0, 2) if total_q > 0 else 0.0

        # Average Response Time in milliseconds
        if response_times:
            avg_rt = round(float(statistics.mean(response_times)), 2)
            median_rt = round(float(statistics.median(response_times)), 2)
        else:
            total_time = preprocessed_data.get("total_time_ms", 0)
            avg_rt = round(float(total_time / total_q), 2) if total_q > 0 else 0.0
            median_rt = avg_rt

        # Hint Rate percentage (0.0 to 100.0%)
        hint_rate = round((hints / total_q) * 100.0, 2) if total_q > 0 else 0.0

        # Completion Rate percentage for completed session (100.0%)
        completion_rate = 100.0

        return {
            "accuracy": accuracy,
            "error_rate": error_rate,
            "average_response_time_ms": avg_rt,
            "median_response_time_ms": median_rt,
            "hint_rate": hint_rate,
            "completion_rate": completion_rate,
            "attempts": preprocessed_data.get("attempts_count", 1),
        }
