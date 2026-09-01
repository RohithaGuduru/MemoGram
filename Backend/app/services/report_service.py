from datetime import datetime, timedelta, timezone, date
from typing import Any, Dict, List, Optional
import statistics
from sqlalchemy.orm import Session

from app.models.patient import Patient
from app.models.weekly_report import WeeklyReport
from app.models.performance_metric import PerformanceMetric
from app.models.performance_trend import PerformanceTrend
from app.models.reminder import Reminder, ReminderLog
from app.schemas.report import WeeklyReportResponse, InsightItem
from app.ai.insight_engine import InsightEngine
from app.utils.enums import GameCategory


class ReportService:

    @classmethod
    def get_or_generate_weekly_report(
        cls,
        db: Session,
        patient_id: str,
        target_date: Optional[date] = None,
    ) -> WeeklyReportResponse:
        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        if not patient:
            raise ValueError("Patient not found")

        ref_date = target_date or datetime.now(timezone.utc).date()
        # Find start of the current week (Monday)
        start_of_week = ref_date - timedelta(days=ref_date.weekday())
        end_of_week = start_of_week + timedelta(days=6)

        # Query metrics within the week
        start_dt = datetime(start_of_week.year, start_of_week.month, start_of_week.day, 0, 0, 0, tzinfo=timezone.utc)
        end_dt = datetime(end_of_week.year, end_of_week.month, end_of_week.day, 23, 59, 59, tzinfo=timezone.utc)

        metrics = db.query(PerformanceMetric).filter(
            PerformanceMetric.patient_id == patient_id,
            PerformanceMetric.created_at >= start_dt,
            PerformanceMetric.created_at <= end_dt,
        ).all()

        games_count = len(metrics)
        avg_acc = round(float(statistics.mean(m.accuracy for m in metrics)), 2) if metrics else 0.0
        avg_rt = round(float(statistics.mean(m.average_response_time_ms for m in metrics)), 2) if metrics else 0.0
        comp_rate = 100.0 if games_count > 0 else 0.0

        # Category summaries
        category_summaries = {}
        for cat in GameCategory:
            cat_metrics = [m for m in metrics if m.game_category == cat]
            if cat_metrics:
                category_summaries[cat.value] = {
                    "sessions_count": len(cat_metrics),
                    "avg_accuracy": round(float(statistics.mean(m.accuracy for m in cat_metrics)), 2),
                    "avg_response_time_ms": round(float(statistics.mean(m.average_response_time_ms for m in cat_metrics)), 2),
                }

        # Reminder stats
        total_reminders = db.query(Reminder).filter(
            Reminder.patient_id == patient_id,
            Reminder.is_active == True,
        ).count()
        logs_count = db.query(ReminderLog).filter(
            ReminderLog.patient_id == patient_id,
            ReminderLog.scheduled_for >= start_dt,
            ReminderLog.scheduled_for <= end_dt,
            ReminderLog.status == "COMPLETED",
        ).count()
        
        expected_reminders_count = total_reminders * 7
        reminder_adherence_pct = round((logs_count / max(1, expected_reminders_count)) * 100.0, 2) if expected_reminders_count > 0 else 100.0

        reminder_stats = {
            "active_reminders_count": total_reminders,
            "completed_logs_count": logs_count,
            "adherence_percentage": min(100.0, reminder_adherence_pct),
        }

        # Trends
        trends = db.query(PerformanceTrend).filter(PerformanceTrend.patient_id == patient_id).all()
        trends_dict = {
            t.game_category.value: {
                "trend_direction": t.trend_direction.value,
                "percentage_change": t.percentage_change,
            }
            for t in trends
        }

        # AI Insights
        raw_insights = InsightEngine.generate_weekly_insights(
            games_played=games_count,
            completion_rate=comp_rate,
            avg_accuracy=avg_acc,
            category_trends=trends_dict,
            reminders_completed_pct=reminder_stats["adherence_percentage"],
        )

        insights_schemas = [
            InsightItem(category=i["category"], message=i["message"], impact=i["impact"])
            for i in raw_insights
        ]

        # Upsert WeeklyReport record
        report = db.query(WeeklyReport).filter(
            WeeklyReport.patient_id == patient_id,
            WeeklyReport.week_start_date == start_of_week,
        ).first()

        now = datetime.now(timezone.utc)
        if report:
            report.week_end_date = end_of_week
            report.games_played_count = games_count
            report.activity_completion_rate = comp_rate
            report.average_accuracy = avg_acc
            report.average_response_time_ms = avg_rt
            report.category_summaries = category_summaries
            report.reminder_stats = reminder_stats
            report.performance_trends = trends_dict
            report.insights = [i.model_dump() for i in insights_schemas]
        else:
            report = WeeklyReport(
                patient_id=patient_id,
                week_start_date=start_of_week,
                week_end_date=end_of_week,
                games_played_count=games_count,
                activity_completion_rate=comp_rate,
                average_accuracy=avg_acc,
                average_response_time_ms=avg_rt,
                category_summaries=category_summaries,
                reminder_stats=reminder_stats,
                performance_trends=trends_dict,
                insights=[i.model_dump() for i in insights_schemas],
                created_at=now,
            )
            db.add(report)

        db.commit()
        db.refresh(report)

        return WeeklyReportResponse(
            id=report.id,
            patient_id=report.patient_id,
            patient_name=patient.user.full_name if patient.user else "Patient",
            week_start_date=report.week_start_date,
            week_end_date=report.week_end_date,
            games_played_count=report.games_played_count,
            activity_completion_rate=report.activity_completion_rate,
            average_accuracy=report.average_accuracy,
            average_response_time_ms=report.average_response_time_ms,
            category_summaries=report.category_summaries or {},
            reminder_stats=report.reminder_stats or {},
            performance_trends=report.performance_trends or {},
            insights=insights_schemas,
            created_at=report.created_at,
        )
