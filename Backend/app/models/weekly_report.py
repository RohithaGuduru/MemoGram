import uuid
from datetime import date, datetime, timezone
from typing import TYPE_CHECKING, Any
from sqlalchemy import String, Integer, Float, Date, ForeignKey, DateTime, JSON, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.patient import Patient


class WeeklyReport(Base):
    __tablename__ = "weekly_reports"
    __table_args__ = (
        UniqueConstraint("patient_id", "week_start_date", name="uq_patient_week_report"),
    )

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )
    patient_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("patients.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    week_start_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    week_end_date: Mapped[date] = mapped_column(Date, nullable=False)
    games_played_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    activity_completion_rate: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    average_accuracy: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    average_response_time_ms: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    category_summaries: Mapped[Any] = mapped_column(JSON, default=dict, nullable=False)
    reminder_stats: Mapped[Any] = mapped_column(JSON, default=dict, nullable=False)
    performance_trends: Mapped[Any] = mapped_column(JSON, default=dict, nullable=False)
    insights: Mapped[Any] = mapped_column(JSON, default=list, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    patient: Mapped["Patient"] = relationship("Patient", back_populates="weekly_reports")
