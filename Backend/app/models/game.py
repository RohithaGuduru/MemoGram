import uuid
from typing import TYPE_CHECKING, List, Any
from sqlalchemy import String, Text, Integer, Boolean, JSON, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin
from app.utils.enums import GameCategory

if TYPE_CHECKING:
    from app.models.game_session import GameSession
    from app.models.performance_metric import PerformanceMetric
    from app.models.recommendation import Recommendation


class Game(Base, TimestampMixin):
    __tablename__ = "games"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )
    code: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[GameCategory] = mapped_column(
        SQLEnum(GameCategory),
        nullable=False,
        index=True,
    )
    description: Mapped[str] = mapped_column(Text, nullable=False)
    min_difficulty: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    max_difficulty: Mapped[int] = mapped_column(Integer, default=5, nullable=False)
    default_config: Mapped[Any] = mapped_column(JSON, default=dict, nullable=False)
    metadata_info: Mapped[Any] = mapped_column(JSON, default=dict, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)

    # Relationships
    sessions: Mapped[List["GameSession"]] = relationship("GameSession", back_populates="game")
    performance_metrics: Mapped[List["PerformanceMetric"]] = relationship(
        "PerformanceMetric",
        back_populates="game",
    )
    recommendations: Mapped[List["Recommendation"]] = relationship(
        "Recommendation",
        back_populates="game",
    )
