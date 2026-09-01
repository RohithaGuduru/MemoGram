from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
import statistics
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.logging import get_logger
from app.models.patient import Patient
from app.models.ai_insight import AIInsight
from app.models.performance_metric import PerformanceMetric
from app.models.baseline import Baseline
from app.models.performance_trend import PerformanceTrend
from app.models.reminder import Reminder, ReminderLog
from app.schemas.ai import AIInsightResponse
from app.services.gemini_service import GeminiService
from app.ai.insight_engine import InsightEngine
from app.utils.enums import GameCategory

logger = get_logger("app.services.ai_insights_service")


class AIInsightsService:
    """
    Caregiver AI Insight Service.
    Transforms structured telemetry from the metrics, baseline, and trend engines
    into clear, non-diagnostic caregiver summaries and actionable supportive observations.
    """

    SYSTEM_INSTRUCTION = """
You are an expert, compassionate AI assistant generating helpful summaries for family members and caregivers of elderly individuals.

CRITICAL MEDICAL & SAFETY RULES (NEVER VIOLATE):
1. You are strictly an activity assistance and explanation layer. You are NOT a medical diagnostic system.
2. NEVER produce clinical diagnoses, such as:
   - "Your loved one's dementia is getting worse."
   - "Dementia is improving."
   - "Patient has cognitive decline."
   - "You have Alzheimer's / dementia."
   - "Medication should be increased/decreased/changed."
3. INSTEAD, strictly frame observations around activity engagement and game performance:
   - "Recent memory activity accuracy was 8% above the established personal baseline."
   - "Attention exercises showed higher error rates this week; shorter 3-minute sessions may improve comfort."
   - "Daily routine consistency has been very strong with high reminder adherence."
   - "For persistent concerns, consider discussing with a healthcare professional."
4. OUTPUT FORMAT: You MUST return a single valid JSON object strictly matching this schema:
{
  "summary": "1-2 sentence overall summary of weekly activity engagement and routine consistency.",
  "positive_observations": ["list of specific strengths, high scores, or upward activity trends"],
  "areas_to_watch": ["list of activities with higher hesitation or lower completion"],
  "activity_observations": ["detailed observations for memory, attention, or pattern exercises"],
  "suggested_actions": ["practical, non-medical steps for the caregiver, e.g. encouragement, hydration, gentle pacing"],
  "confidence": "high" | "moderate" | "low"
}
"""

    @classmethod
    def collect_structured_metrics(
        cls,
        db: Session,
        patient_id: str,
        timeframe_days: int = 7,
    ) -> Dict[str, Any]:
        """
        Collects structured performance and routine metrics from the existing analytics system.
        Does not send raw database dumps.
        """
        now = datetime.now(timezone.utc)
        start_date = now - timedelta(days=timeframe_days)

        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        patient_name = patient.user.full_name if (patient and patient.user) else "The patient"

        # 1. Performance metrics
        metrics = db.query(PerformanceMetric).filter(
            PerformanceMetric.patient_id == patient_id,
            PerformanceMetric.created_at >= start_date,
        ).all()

        games_count = len(metrics)
        avg_acc = round(float(statistics.mean(m.accuracy for m in metrics)), 2) if metrics else 0.0
        avg_rt = round(float(statistics.mean(m.average_response_time_ms for m in metrics)), 2) if metrics else 0.0

        # 2. Domain breakdown & Baselines
        baselines = db.query(Baseline).filter(Baseline.patient_id == patient_id).all()
        baseline_map = {b.game_category.value: b.baseline_accuracy for b in baselines}

        trends = db.query(PerformanceTrend).filter(PerformanceTrend.patient_id == patient_id).all()
        trend_map = {t.game_category.value: {"direction": t.trend_direction.value, "pct_change": t.percentage_change} for t in trends}

        categories_summary = {}
        for cat in GameCategory:
            cat_m = [m for m in metrics if m.game_category == cat]
            if cat_m or cat.value in baseline_map:
                cat_acc = round(float(statistics.mean(m.accuracy for m in cat_m)), 2) if cat_m else None
                base_acc = baseline_map.get(cat.value)
                tr = trend_map.get(cat.value, {"direction": "stable", "pct_change": 0.0})
                categories_summary[cat.value] = {
                    "sessions_this_period": len(cat_m),
                    "current_accuracy": cat_acc,
                    "baseline_accuracy": base_acc,
                    "trend_direction": tr["direction"],
                    "trend_percentage_change": tr["pct_change"],
                }

        # 3. Reminder adherence
        active_reminders = db.query(Reminder).filter(Reminder.patient_id == patient_id, Reminder.is_active == True).count()
        logs_count = db.query(ReminderLog).filter(
            ReminderLog.patient_id == patient_id,
            ReminderLog.scheduled_for >= start_date,
            ReminderLog.status == "COMPLETED",
        ).count()
        expected = active_reminders * timeframe_days
        adherence_pct = round((logs_count / max(1, expected)) * 100.0, 2) if expected > 0 else 100.0

        return {
            "patient_name": patient_name,
            "timeframe_days": timeframe_days,
            "games_completed": games_count,
            "overall_average_accuracy": avg_acc,
            "average_response_time_ms": avg_rt,
            "category_performance": categories_summary,
            "routine_adherence": {
                "active_reminders_count": active_reminders,
                "completed_logs_count": logs_count,
                "adherence_percentage": min(100.0, adherence_pct),
            },
        }

    @classmethod
    def generate_patient_insights(
        cls,
        db: Session,
        patient_id: str,
        force_refresh: bool = False,
        timeframe: str = "week",
    ) -> AIInsightResponse:
        """
        Generates or retrieves caregiver AI insights for the target patient.
        Uses Gemini structured output when available, and gracefully falls back to deterministic rules.
        """
        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        if not patient:
            raise ValueError(f"Patient with ID {patient_id} not found.")

        # Check for recent insight (within last 12 hours) if not force_refresh
        if not force_refresh:
            recent_threshold = datetime.now(timezone.utc) - timedelta(hours=12)
            cached_insight = db.query(AIInsight).filter(
                AIInsight.patient_id == patient_id,
                AIInsight.generated_at >= recent_threshold,
            ).order_by(AIInsight.generated_at.desc()).first()

            if cached_insight:
                return AIInsightResponse.model_validate(cached_insight)

        # 1. Collect structured metrics
        timeframe_days = 30 if timeframe == "month" else 7
        structured_data = cls.collect_structured_metrics(db, patient_id, timeframe_days)

        prompt = f"""
Here is the structured cognitive activity and routine telemetry for {structured_data['patient_name']}:
- Period: Last {timeframe_days} days
- Activities Completed: {structured_data['games_completed']}
- Overall Average Accuracy: {structured_data['overall_average_accuracy']}%
- Average Response Time: {structured_data['average_response_time_ms']} ms
- Routine & Medication Adherence: {structured_data['routine_adherence']['adherence_percentage']}%
- Cognitive Activity Categories:
{structured_data['category_performance']}

Generate compassionate, explainable, strictly non-diagnostic caregiver insights as a single JSON object.
"""

        # 2. Attempt Gemini generation
        parsed_json = GeminiService.generate_structured_json(
            prompt=prompt,
            system_instruction=cls.SYSTEM_INSTRUCTION,
        )

        model_name = settings.GEMINI_MODEL

        # 3. Fallback to deterministic engine if Gemini failed or key missing
        if not parsed_json or not isinstance(parsed_json, dict) or "summary" not in parsed_json:
            logger.info(f"Using deterministic fallback for caregiver insights (patient: {patient_id})")
            parsed_json = cls._generate_fallback_insight(structured_data)
            model_name = "mind_ease_deterministic_v1"

        # Sanitize safety: ensure no forbidden diagnostic words slipped in
        summary_clean = cls._sanitize_safety_text(parsed_json.get("summary", ""))

        # 4. Persist insight in database
        now = datetime.now(timezone.utc)
        insight_record = AIInsight(
            patient_id=patient_id,
            summary=summary_clean,
            positive_observations=parsed_json.get("positive_observations", []),
            areas_to_watch=parsed_json.get("areas_to_watch", []),
            activity_observations=parsed_json.get("activity_observations", []),
            suggested_actions=parsed_json.get("suggested_actions", []),
            confidence=parsed_json.get("confidence", "moderate"),
            model=model_name,
            source_metrics_version="v1.0",
            raw_metrics=structured_data,
            generated_at=now,
        )
        db.add(insight_record)
        db.commit()
        db.refresh(insight_record)

        return AIInsightResponse.model_validate(insight_record)

    @classmethod
    def get_latest_insight(cls, db: Session, patient_id: str) -> Optional[AIInsightResponse]:
        """Retrieves the most recent stored AI insight for a patient, or generates one if none exists."""
        insight = db.query(AIInsight).filter(
            AIInsight.patient_id == patient_id
        ).order_by(AIInsight.generated_at.desc()).first()

        if insight:
            return AIInsightResponse.model_validate(insight)

        # If no insight stored yet, generate initial one
        return cls.generate_patient_insights(db, patient_id, force_refresh=True)

    # -------------------------------------------------------------------------
    # Fallback Deterministic Insight Generator
    # -------------------------------------------------------------------------
    @classmethod
    def _generate_fallback_insight(cls, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Creates high-quality, structured, non-diagnostic caregiver insights
        purely using deterministic rules from the existing InsightEngine.
        """
        name = data.get("patient_name", "The patient")
        games_completed = data.get("games_completed", 0)
        overall_acc = data.get("overall_average_accuracy", 0.0)
        adherence = data.get("routine_adherence", {}).get("adherence_percentage", 100.0)
        categories = data.get("category_performance", {})

        positives: List[str] = []
        areas_watch: List[str] = []
        activity_obs: List[str] = []
        actions: List[str] = []

        if games_completed >= 5:
            positives.append(f"Consistent engagement with {games_completed} cognitive activities completed over the period.")
        else:
            areas_watch.append(f"Activity participation was light ({games_completed} sessions completed).")

        if overall_acc >= 75.0:
            positives.append(f"Strong overall activity accuracy ({overall_acc}%) across completed exercises.")
        elif overall_acc > 0:
            areas_watch.append(f"Average accuracy was {overall_acc}%. Supportive guidance helps build comfort.")

        if adherence >= 85.0:
            positives.append(f"Outstanding routine consistency with {adherence}% reminder adherence.")
        else:
            areas_watch.append(f"Reminder acknowledgment was at {adherence}%. Routine check-ins may be helpful.")

        for cat_name, cat_data in categories.items():
            readable = cat_name.replace("_", " ").title()
            trend = cat_data.get("trend_direction")
            current = cat_data.get("current_accuracy")
            base = cat_data.get("baseline_accuracy")

            if trend == "improving":
                activity_obs.append(f"{readable} activities showed an upward trend compared to recent baseline.")
            elif trend == "declining":
                activity_obs.append(f"{readable} exercises had higher error rates; adapting difficulty will provide a comfortable pace.")
            elif current is not None and base is not None:
                activity_obs.append(f"{readable} performance remains steady and aligned with baseline ({current}%).")

        actions.append("Encourage regular 3-to-5 minute activity sessions at the patient's preferred comfortable time.")
        actions.append("Maintain good hydration and a quiet environment during cognitive exercises.")

        summary = f"{name} completed {games_completed} activity sessions with {overall_acc}% average accuracy and {adherence}% routine adherence."

        return {
            "summary": summary,
            "positive_observations": positives,
            "areas_to_watch": areas_watch,
            "activity_observations": activity_obs,
            "suggested_actions": actions,
            "confidence": "high" if games_completed >= 5 else "moderate",
        }

    # -------------------------------------------------------------------------
    # Safety Text Sanitizer
    # -------------------------------------------------------------------------
    @classmethod
    def _sanitize_safety_text(cls, text: str) -> str:
        """
        Replaces any accidental clinical diagnostic terminology with neutral activity-performance terms.
        """
        replacements = [
            ("dementia is worsening", "activity performance was lower than baseline"),
            ("dementia is getting worse", "recent exercises showed higher error rates"),
            ("dementia is improving", "activity performance showed positive engagement"),
            ("cognitive decline", "lower activity accuracy"),
            ("you have dementia", "activity engagement monitoring"),
        ]
        sanitized = text
        for forbidden, safe in replacements:
            sanitized = sanitized.replace(forbidden, safe)
            sanitized = sanitized.replace(forbidden.capitalize(), safe.capitalize())
        return sanitized
