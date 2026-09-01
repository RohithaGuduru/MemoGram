from typing import Any, Dict, List, Optional
import math


class GameDataPreprocessor:
    """
    Validates, sanitizes, and prepares raw game session telemetry data
    for the cognitive engagement metrics engine.
    """

    MIN_VALID_RT_MS = 100       # Under 100ms is likely an accidental tap or bounce
    MAX_VALID_RT_MS = 180000    # Over 3 minutes per item indicates interruption / paused game

    @classmethod
    def sanitize_raw_result(cls, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validates raw payload fields, removes anomalies, and normalizes telemetry.
        """
        total_questions = max(1, int(raw_data.get("total_questions", 1)))
        correct_answers = max(0, min(total_questions, int(raw_data.get("correct_answers", 0))))
        
        # Infer or clamp incorrect answers
        provided_incorrect = raw_data.get("incorrect_answers")
        if provided_incorrect is not None:
            incorrect_answers = max(0, min(total_questions, int(provided_incorrect)))
        else:
            incorrect_answers = total_questions - correct_answers

        # Ensure correct + incorrect does not exceed total
        if correct_answers + incorrect_answers > total_questions:
            incorrect_answers = max(0, total_questions - correct_answers)

        errors_count = max(0, int(raw_data.get("errors_count", incorrect_answers)))
        attempts_count = max(1, int(raw_data.get("attempts_count", total_questions)))
        hints_used = max(0, int(raw_data.get("hints_used", 0)))
        total_time_ms = max(0, int(raw_data.get("total_time_ms", 0)))

        # Sanitize and filter per-question response times
        raw_response_times: List[int] = raw_data.get("response_times", [])
        cleaned_response_times: List[int] = []

        for rt in raw_response_times:
            if isinstance(rt, (int, float)) and not math.isnan(rt):
                rt_int = int(rt)
                # Clamp within reasonable physiological reaction boundaries
                if cls.MIN_VALID_RT_MS <= rt_int <= cls.MAX_VALID_RT_MS:
                    cleaned_response_times.append(rt_int)

        # Fallback if per-item response times array is missing or empty
        if not cleaned_response_times and total_questions > 0 and total_time_ms > 0:
            avg_fallback = max(cls.MIN_VALID_RT_MS, min(cls.MAX_VALID_RT_MS, total_time_ms // total_questions))
            cleaned_response_times = [avg_fallback] * total_questions

        return {
            "total_questions": total_questions,
            "correct_answers": correct_answers,
            "incorrect_answers": incorrect_answers,
            "errors_count": errors_count,
            "attempts_count": attempts_count,
            "hints_used": hints_used,
            "total_time_ms": total_time_ms,
            "response_times": cleaned_response_times,
            "answered_count": len(cleaned_response_times) if cleaned_response_times else total_questions,
            "raw_events": raw_data.get("raw_events", []),
        }
