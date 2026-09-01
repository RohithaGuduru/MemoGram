import uuid
from datetime import datetime, time, timezone
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import String, Text, Boolean, Time, ForeignKey, DateTime, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin
from app.utils.enums import ReminderType

if TYPE_CHECKING:
    from app.models.patient import Patient
    from app.models.medication import Medication


class Reminder(Base, TimestampMixin):
    __tablename__ = "reminders"

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
    medication_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("medications.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    reminder_type: Mapped[ReminderType] = mapped_column(
        SQLEnum(ReminderType),
        nullable=False,
        index=True,
    )
    scheduled_time: Mapped[time] = mapped_column(Time, nullable=False)
    recurrence_rule: Mapped[str] = mapped_column(
        String(128),
        default="DAILY",
        nullable=False,
    )  # e.g., 'DAILY', 'HOURLY', 'ONCE'
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)
    last_completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # Relationships
    patient: Mapped["Patient"] = relationship("Patient", back_populates="reminders")
    medication: Mapped[Optional["Medication"]] = relationship("Medication", back_populates="reminders")
    logs: Mapped[List["ReminderLog"]] = relationship(
        "ReminderLog",
        back_populates="reminder",
        cascade="all, delete-orphan",
    )


class ReminderLog(Base):
    __tablename__ = "reminder_logs"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )
    reminder_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("reminders.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    patient_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("patients.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    scheduled_for: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    status: Mapped[str] = mapped_column(
        String(32),
        default="COMPLETED",
        nullable=False,
    )  # 'COMPLETED', 'MISSED', 'SNOOZED'

    # Relationships
    reminder: Mapped["Reminder"] = relationship("Reminder", back_populates="logs")
    patient: Mapped["Patient"] = relationship("Patient", back_populates="reminder_logs")
