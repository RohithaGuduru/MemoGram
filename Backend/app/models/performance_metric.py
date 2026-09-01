import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING
from sqlalchemy import String, Integer, Float, ForeignKey, DateTime, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.utils.enums import GameCategory

if TYPE_CHECKING:
    from app.models.patient import Patient
    from app.models.game import Game
    from app.models.game_session import GameSession


class PerformanceMetric(Base):
    __tablename__ = "performance_metrics"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )
    session_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("game_sessions.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    patient_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("patients.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    game_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("games.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    game_category: Mapped[GameCategory] = mapped_column(
        SQLEnum(GameCategory),
        nullable=False,
        index=True,
    )
    difficulty: Mapped[int] = mapped_column(Integer, nullable=False)
    accuracy: Mapped[float] = mapped_column(Float, nullable=False)  # 0.0 - 100.0
    error_rate: Mapped[float] = mapped_column(Float, nullable=False)  # 0.0 - 100.0
    average_response_time_ms: Mapped[float] = mapped_column(Float, nullable=False)
    median_response_time_ms: Mapped[float] = mapped_column(Float, nullable=False)
    hint_rate: Mapped[float] = mapped_column(Float, nullable=False)  # 0.0 - 100.0
    completion_rate: Mapped[float] = mapped_column(Float, default=100.0, nullable=False)
    attempts: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )

    # Relationships
    session: Mapped["GameSession"] = relationship(
        "GameSession",
        back_populates="performance_metric",
    )
    patient: Mapped["Patient"] = relationship(
        "Patient",
        back_populates="performance_metrics",
    )
    game: Mapped["Game"] = relationship("Game", back_populates="performance_metrics")
