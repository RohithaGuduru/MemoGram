import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional
from sqlalchemy import String, Integer, ForeignKey, DateTime, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.utils.enums import GameCategory, SessionStatus

if TYPE_CHECKING:
    from app.models.patient import Patient
    from app.models.game import Game
    from app.models.game_result import GameResult
    from app.models.performance_metric import PerformanceMetric


class GameSession(Base):
    __tablename__ = "game_sessions"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )
    client_session_id: Mapped[str] = mapped_column(
        String(128),
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
    difficulty: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    device_id: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    status: Mapped[SessionStatus] = mapped_column(
        SQLEnum(SessionStatus),
        default=SessionStatus.IN_PROGRESS,
        nullable=False,
        index=True,
    )

    # Relationships
    patient: Mapped["Patient"] = relationship("Patient", back_populates="game_sessions")
    game: Mapped["Game"] = relationship("Game", back_populates="sessions")
    result: Mapped[Optional["GameResult"]] = relationship(
        "GameResult",
        back_populates="session",
        uselist=False,
        cascade="all, delete-orphan",
    )
    performance_metric: Mapped[Optional["PerformanceMetric"]] = relationship(
        "PerformanceMetric",
        back_populates="session",
        uselist=False,
        cascade="all, delete-orphan",
    )
