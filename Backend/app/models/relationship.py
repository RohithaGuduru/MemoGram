import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional
from sqlalchemy import String, Boolean, ForeignKey, DateTime, Integer, Enum as SQLEnum, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.utils.enums import RelationshipStatus

if TYPE_CHECKING:
    from app.models.caregiver import Caregiver
    from app.models.patient import Patient


class PatientCaretakerRelationship(Base):
    __tablename__ = "caregiver_patients"
    __table_args__ = (
        UniqueConstraint("caregiver_id", "patient_id", name="uq_caregiver_patient"),
        {"extend_existing": True},
    )

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )
    caregiver_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("caregivers.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    patient_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("patients.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    relation_type: Mapped[str] = mapped_column(
        String(64),
        default="primary_caretaker",
        nullable=False,
    )
    status: Mapped[RelationshipStatus] = mapped_column(
        SQLEnum(RelationshipStatus),
        default=RelationshipStatus.ACTIVE,
        nullable=False,
        index=True,
    )
    is_primary: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Secure OTP Lifecycle Fields
    otp_hash: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    otp_expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    otp_attempts: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    otp_created_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

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

    # Relationships
    caregiver: Mapped["Caregiver"] = relationship(
        "Caregiver",
        back_populates="patient_associations",
    )
    patient: Mapped["Patient"] = relationship(
        "Patient",
        back_populates="caregiver_associations",
    )


# Alias for backward compatibility
CaregiverPatient = PatientCaretakerRelationship
