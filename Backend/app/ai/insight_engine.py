from typing import Any, Dict, List, Optional
from app.utils.enums import TrendDirection, GameCategory


class InsightEngine:
    """
    Caregiver & Patient Activity Insight Engine.
    
    CRITICAL RULE:
    Strictly generates activity-performance insights and recommendations.
    Never produces clinical diagnoses, dementia classifications, or disease prognosis.
    """

    @classmethod
    def generate_session_insights(
        cls,
        current_metrics: Dict[str, Any],
        baseline_comparison: Optional[Dict[str, Any]],
        game_category: GameCategory,
    ) -> List[Dict[str, str]]:
        insights: List[Dict[str, str]] = []
        readable_cat = game_category.value.replace("_", " ").title()

        if baseline_comparison:
            direction = baseline_comparison.get("direction")
            pct = baseline_comparison.get("percentage_change", 0.0)

            if direction == "improving" and pct > 5.0:
                insights.append({
                    "category": game_category.value,
                    "message": f"Recent {readable_cat} activity accuracy is {abs(pct)}% higher than the patient's recent baseline.",
                    "impact": "positive",
                })
            elif direction == "declining" and pct < -10.0:
                insights.append({
                    "category": game_category.value,
                    "message": f"{readable_cat} activity performance showed higher error rate compared to baseline. A lower difficulty level may provide better comfort.",
                    "impact": "attention_needed",
                })
            else:
                insights.append({
                    "category": game_category.value,
                    "message": f"{readable_cat} engagement remains steady and consistent with the established baseline.",
                    "impact": "neutral",
                })

        # High response time / hesitation insight
        if current_metrics.get("average_response_time_ms", 0) > 8000:
            insights.append({
                "category": "RESPONSE_PACING",
                "message": "Patient took more time per item; allowing relaxed, unhurried pacing encourages cognitive comfort.",
                "impact": "neutral",
            })

        return insights

    @classmethod
    def generate_weekly_insights(
        cls,
        games_played: int,
        completion_rate: float,
        avg_accuracy: float,
        category_trends: Dict[str, Any],
        reminders_completed_pct: float,
    ) -> List[Dict[str, str]]:
        insights: List[Dict[str, str]] = []

        # 1. Overall activity engagement
        if games_played >= 10:
            insights.append({
                "category": "ENGAGEMENT",
                "message": f"Excellent participation this week with {games_played} cognitive activities completed.",
                "impact": "positive",
            })
        elif games_played <= 3:
            insights.append({
                "category": "ENGAGEMENT",
                "message": f"Activity completion was lower this week ({games_played} sessions). Gentle encouragement to try short 3-minute sessions is recommended.",
                "impact": "attention_needed",
            })

        # 2. Accuracy overview
        if avg_accuracy >= 80.0:
            insights.append({
                "category": "ACCURACY",
                "message": f"High average activity accuracy ({avg_accuracy}%) across all completed exercises.",
                "impact": "positive",
            })
        elif avg_accuracy < 60.0:
            insights.append({
                "category": "ACCURACY",
                "message": f"Average accuracy was {avg_accuracy}%. Adapting to foundational difficulty levels will boost confidence.",
                "impact": "attention_needed",
            })

        # 3. Category trends
        for cat_name, trend in category_trends.items():
            dir_val = trend.get("trend_direction")
            readable = cat_name.replace("_", " ").title()
            if dir_val == TrendDirection.IMPROVING.value:
                insights.append({
                    "category": cat_name,
                    "message": f"Performance in {readable} activities is showing an upward trajectory over recent sessions.",
                    "impact": "positive",
                })
            elif dir_val == TrendDirection.DECLINING.value:
                insights.append({
                    "category": cat_name,
                    "message": f"Recent performance in {readable} activities has decreased relative to baseline.",
                    "impact": "attention_needed",
                })

        # 4. Medication & Reminder adherence
        if reminders_completed_pct >= 90.0:
            insights.append({
                "category": "ROUTINE",
                "message": f"Outstanding routine consistency with {reminders_completed_pct}% of scheduled reminders acknowledged.",
                "impact": "positive",
            })
        elif reminders_completed_pct < 60.0:
            insights.append({
                "category": "ROUTINE",
                "message": f"Reminder acknowledgment was at {reminders_completed_pct}%. Caregiver check-in on daily schedules is advised.",
                "impact": "attention_needed",
            })

        return insights
