import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING
from sqlalchemy import String, Integer, Float, ForeignKey, DateTime, UniqueConstraint, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.utils.enums import GameCategory

if TYPE_CHECKING:
    from app.models.patient import Patient


class Baseline(Base):
    __tablename__ = "baselines"
    __table_args__ = (
        UniqueConstraint("patient_id", "game_category", "difficulty_level", name="uq_patient_cat_diff_baseline"),
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
    game_category: Mapped[GameCategory] = mapped_column(
        SQLEnum(GameCategory),
        nullable=False,
        index=True,
    )
    difficulty_level: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    baseline_accuracy: Mapped[float] = mapped_column(Float, nullable=False)
    baseline_response_time_ms: Mapped[float] = mapped_column(Float, nullable=False)
    baseline_error_rate: Mapped[float] = mapped_column(Float, nullable=False)
    baseline_hint_rate: Mapped[float] = mapped_column(Float, nullable=False)
    baseline_completion_rate: Mapped[float] = mapped_column(Float, default=100.0, nullable=False)
    sample_count: Mapped[int] = mapped_column(Integer, default=5, nullable=False)
    last_updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    patient: Mapped["Patient"] = relationship("Patient", back_populates="baselines")
