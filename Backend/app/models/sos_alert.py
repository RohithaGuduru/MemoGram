import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional, Any
from sqlalchemy import String, Float, ForeignKey, DateTime, JSON, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.utils.enums import SOSStatus

if TYPE_CHECKING:
    from app.models.patient import Patient


class SOSAlert(Base):
    __tablename__ = "sos_alerts"
    __table_args__ = {"extend_existing": True}

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
    status: Mapped[SOSStatus] = mapped_column(
        SQLEnum(SOSStatus),
        default=SOSStatus.TRIGGERED,
        nullable=False,
        index=True,
    )
    latitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    message: Mapped[str] = mapped_column(String(512), default="Emergency SOS assistance requested by patient.", nullable=False)
    metadata_info: Mapped[Any] = mapped_column(JSON, default=dict, nullable=False)

    triggered_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )
    acknowledged_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    resolved_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # Relationships
    patient: Mapped["Patient"] = relationship("Patient", back_populates="sos_alerts")
