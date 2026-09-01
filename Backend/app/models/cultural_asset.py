import uuid
from typing import Any
from sqlalchemy import String, Text, Boolean, JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class CulturalAsset(Base, TimestampMixin):
    __tablename__ = "cultural_assets"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )
    asset_code: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    category: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        index=True,
    )  # 'food', 'household', 'nature', 'family', 'music', 'places', 'local_objects'
    language: Mapped[str] = mapped_column(String(16), default="en", nullable=False, index=True)
    region: Mapped[str] = mapped_column(String(64), default="NE_INDIA", nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    asset_url: Mapped[str] = mapped_column(Text, nullable=False)
    metadata_info: Mapped[Any] = mapped_column(JSON, default=dict, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
