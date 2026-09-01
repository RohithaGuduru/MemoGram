import uuid
from datetime import datetime, timezone
from typing import Any, Dict
from sqlalchemy import String, Boolean, DateTime, JSON, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.utils.enums import LanguageCapabilityStatus


class LanguageCapability(Base):
    __tablename__ = "language_capabilities"
    __table_args__ = {"extend_existing": True}

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )
    language_code: Mapped[str] = mapped_column(String(16), unique=True, nullable=False, index=True)
    display_name: Mapped[str] = mapped_column(String(64), nullable=False)
    native_name: Mapped[str] = mapped_column(String(64), nullable=False)
    script: Mapped[str] = mapped_column(String(64), nullable=False)

    # Granular capability flags & providers
    text_available: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    ui_text_available: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    stt_available: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    stt_provider: Mapped[str] = mapped_column(String(64), default="none", nullable=False)

    translation_available: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    translation_provider: Mapped[str] = mapped_column(String(64), default="none", nullable=False)

    tts_available: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    tts_provider: Mapped[str] = mapped_column(String(64), default="none", nullable=False)

    status: Mapped[LanguageCapabilityStatus] = mapped_column(
        SQLEnum(LanguageCapabilityStatus),
        default=LanguageCapabilityStatus.AVAILABLE,
        nullable=False,
        index=True,
    )
    enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    metadata_info: Mapped[Any] = mapped_column(JSON, default=dict, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    def to_capability_dict(self) -> Dict[str, Any]:
        return {
            "language_code": self.language_code,
            "display_name": self.display_name,
            "native_name": self.native_name,
            "script": self.script,
            "text_available": self.text_available,
            "ui_text_available": self.ui_text_available,
            "capabilities": {
                "stt": {
                    "available": self.stt_available,
                    "provider": self.stt_provider,
                },
                "translation": {
                    "available": self.translation_available,
                    "provider": self.translation_provider,
                },
                "tts": {
                    "available": self.tts_available,
                    "provider": self.tts_provider,
                },
            },
            "status": self.status.value,
            "enabled": self.enabled,
        }
