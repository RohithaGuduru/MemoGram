import uuid
from datetime import date
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import String, Text, Boolean, Date, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.patient import Patient
    from app.models.reminder import Reminder


class Medication(Base, TimestampMixin):
    __tablename__ = "medications"

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
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    dosage: Mapped[str] = mapped_column(String(100), nullable=False)  # e.g., '10mg', '1 tablet'
    time_of_day: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
    )  # e.g., '08:00', 'Morning after breakfast'
    frequency: Mapped[str] = mapped_column(
        String(64),
        default="daily",
        nullable=False,
    )  # 'daily', 'twice_daily', 'weekly'
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    instructions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    photo_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)

    # Relationships
    patient: Mapped["Patient"] = relationship("Patient", back_populates="medications")
    reminders: Mapped[List["Reminder"]] = relationship("Reminder", back_populates="medication")
