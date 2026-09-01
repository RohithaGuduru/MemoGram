from typing import Any, Dict, List, Optional
import statistics

from app.utils.enums import DifficultyAction


class DifficultyEngine:
    """
    Explainable, rules-based activity difficulty adaptation engine.
    
    Principles:
    - Avoids abrupt difficulty jumps.
    - Evaluates rolling 3-session window.
    - Clamps to min_difficulty and max_difficulty bounds.
    - Produces transparent, human-readable, non-medical reasoning strings.
    """

    @classmethod
    def evaluate_difficulty(
        cls,
        current_difficulty: int,
        recent_session_metrics: List[Dict[str, Any]],
        min_difficulty: int = 1,
        max_difficulty: int = 5,
    ) -> Dict[str, Any]:
        """
        Evaluates recent performance metrics and determines recommended difficulty.
        """
        # If fewer than 3 sessions exist, maintain current difficulty
        if len(recent_session_metrics) < 3:
            return {
                "current_difficulty": current_difficulty,
                "recommended_difficulty": current_difficulty,
                "action": DifficultyAction.MAINTAIN,
                "reason": "Maintaining current activity difficulty level while building consistent engagement history.",
                "confidence": 0.70,
            }

        recent_3 = recent_session_metrics[-3:]
        avg_accuracy = statistics.mean(s["accuracy"] for s in recent_3)
        avg_error_rate = statistics.mean(s["error_rate"] for s in recent_3)
        avg_hint_rate = statistics.mean(s["hint_rate"] for s in recent_3)
        all_completed = all(s.get("completion_rate", 100.0) >= 90.0 for s in recent_3)

        # Rule 1: Consistently High Performance -> Increase Difficulty
        if avg_accuracy >= 85.0 and avg_error_rate <= 15.0 and avg_hint_rate <= 15.0 and all_completed:
            if current_difficulty < max_difficulty:
                return {
                    "current_difficulty": current_difficulty,
                    "recommended_difficulty": current_difficulty + 1,
                    "action": DifficultyAction.INCREASE,
                    "reason": "Recent activity performance has remained consistently strong across 3 consecutive sessions.",
                    "confidence": 0.90,
                }
            else:
                return {
                    "current_difficulty": current_difficulty,
                    "recommended_difficulty": current_difficulty,
                    "action": DifficultyAction.MAINTAIN,
                    "reason": "Patient is performing exceptionally well at the highest activity difficulty level.",
                    "confidence": 0.95,
                }

        # Rule 2: Persistent High Error / Low Accuracy -> Decrease Difficulty
        if avg_accuracy < 60.0 or avg_error_rate > 40.0:
            if current_difficulty > min_difficulty:
                return {
                    "current_difficulty": current_difficulty,
                    "recommended_difficulty": current_difficulty - 1,
                    "action": DifficultyAction.DECREASE,
                    "reason": "Adjusting activity level to provide a more comfortable, supportive, and confidence-building experience.",
                    "confidence": 0.85,
                }
            else:
                return {
                    "current_difficulty": current_difficulty,
                    "recommended_difficulty": current_difficulty,
                    "action": DifficultyAction.MAINTAIN,
                    "reason": "Maintaining foundational level with supportive guidance and hints.",
                    "confidence": 0.80,
                }

        # Rule 3: Balanced performance zone -> Maintain
        return {
            "current_difficulty": current_difficulty,
            "recommended_difficulty": current_difficulty,
            "action": DifficultyAction.MAINTAIN,
            "reason": "Activity performance is within the optimal cognitive engagement zone.",
            "confidence": 0.85,
        }
