import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING
from sqlalchemy import String, Integer, Float, ForeignKey, DateTime, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.utils.enums import GameCategory, TrendDirection

if TYPE_CHECKING:
    from app.models.patient import Patient


class PerformanceTrend(Base):
    __tablename__ = "performance_trends"

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
    game_category: Mapped[GameCategory] = mapped_column(
        SQLEnum(GameCategory),
        nullable=False,
        index=True,
    )
    metric_name: Mapped[str] = mapped_column(String(64), nullable=False)  # 'accuracy', 'response_time', etc.
    window_size: Mapped[int] = mapped_column(Integer, default=3, nullable=False)
    previous_avg: Mapped[float] = mapped_column(Float, nullable=False)
    recent_avg: Mapped[float] = mapped_column(Float, nullable=False)
    percentage_change: Mapped[float] = mapped_column(Float, nullable=False)
    trend_direction: Mapped[TrendDirection] = mapped_column(
        SQLEnum(TrendDirection),
        nullable=False,
        index=True,
    )
    calculated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    patient: Mapped["Patient"] = relationship("Patient", back_populates="performance_trends")
