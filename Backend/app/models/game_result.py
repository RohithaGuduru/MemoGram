import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Any
from sqlalchemy import String, Integer, ForeignKey, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.patient import Patient
    from app.models.game_session import GameSession


class GameResult(Base):
    __tablename__ = "game_results"

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
    total_questions: Mapped[int] = mapped_column(Integer, nullable=False)
    correct_answers: Mapped[int] = mapped_column(Integer, nullable=False)
    incorrect_answers: Mapped[int] = mapped_column(Integer, nullable=False)
    errors_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    attempts_count: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    hints_used: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_time_ms: Mapped[int] = mapped_column(Integer, nullable=False)
    response_times: Mapped[Any] = mapped_column(JSON, default=list, nullable=False)
    raw_events: Mapped[Any] = mapped_column(JSON, default=list, nullable=False)
    submitted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )

    # Relationships
    session: Mapped["GameSession"] = relationship("GameSession", back_populates="result")
    patient: Mapped["Patient"] = relationship("Patient", back_populates="game_results")
