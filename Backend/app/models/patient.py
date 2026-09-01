import uuid
from datetime import date
from typing import TYPE_CHECKING, List, Optional, Any
from sqlalchemy import String, Date, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.relationship import PatientCaretakerRelationship
    from app.models.family_member import FamilyMember
    from app.models.medication import Medication
    from app.models.reminder import Reminder, ReminderLog
    from app.models.game_session import GameSession
    from app.models.game_result import GameResult
    from app.models.performance_metric import PerformanceMetric
    from app.models.baseline import Baseline
    from app.models.performance_trend import PerformanceTrend
    from app.models.recommendation import Recommendation
    from app.models.weekly_report import WeeklyReport
    from app.models.alert import Alert
    from app.models.device import Device
    from app.models.sync_record import SyncRecord
    from app.models.ai_insight import AIInsight
    from app.models.sos_alert import SOSAlert


class Patient(Base, TimestampMixin):
    __tablename__ = "patients"
    __table_args__ = {"extend_existing": True}

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    date_of_birth: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    gender: Mapped[Optional[str]] = mapped_column(String(16), nullable=True)
    profile_photo_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    emergency_contact_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    emergency_contact_phone: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)

    # Multilingual Preferences (Preference 1 & Preference 2)
    primary_language: Mapped[str] = mapped_column(
        String(16),
        default="as",
        nullable=False,
    )  # Native primary language (e.g. 'as', 'hi', 'en', 'mni', 'brx', 'trp', 'lus')
    fallback_language: Mapped[str] = mapped_column(
        String(16),
        default="en",
        nullable=False,
    )  # Fallback language (e.g. 'en')
    preferred_language: Mapped[str] = mapped_column(
        String(16),
        default="as",
        nullable=False,
    )  # Compatibility field mirroring primary_language

    font_size: Mapped[str] = mapped_column(
        String(16),
        default="medium",
        nullable=False,
    )  # 'medium', 'large', 'extra_large'
    timezone: Mapped[str] = mapped_column(
        String(64),
        default="Asia/Kolkata",
        nullable=False,
    )
    voice_preference: Mapped[str] = mapped_column(
        String(32),
        default="female_calm",
        nullable=False,
    )
    interests: Mapped[Any] = mapped_column(JSON, default=list, nullable=False)
    accessibility_preferences: Mapped[Any] = mapped_column(
        JSON,
        default=dict,
        nullable=False,
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="patient_profile")
    caregiver_associations: Mapped[List["PatientCaretakerRelationship"]] = relationship(
        "PatientCaretakerRelationship",
        back_populates="patient",
        cascade="all, delete-orphan",
    )
    family_members: Mapped[List["FamilyMember"]] = relationship(
        "FamilyMember",
        back_populates="patient",
        cascade="all, delete-orphan",
    )
    medications: Mapped[List["Medication"]] = relationship(
        "Medication",
        back_populates="patient",
        cascade="all, delete-orphan",
    )
    reminders: Mapped[List["Reminder"]] = relationship(
        "Reminder",
        back_populates="patient",
        cascade="all, delete-orphan",
    )
    reminder_logs: Mapped[List["ReminderLog"]] = relationship(
        "ReminderLog",
        back_populates="patient",
        cascade="all, delete-orphan",
    )
    game_sessions: Mapped[List["GameSession"]] = relationship(
        "GameSession",
        back_populates="patient",
        cascade="all, delete-orphan",
    )
    game_results: Mapped[List["GameResult"]] = relationship(
        "GameResult",
        back_populates="patient",
        cascade="all, delete-orphan",
    )
    performance_metrics: Mapped[List["PerformanceMetric"]] = relationship(
        "PerformanceMetric",
        back_populates="patient",
        cascade="all, delete-orphan",
    )
    baselines: Mapped[List["Baseline"]] = relationship(
        "Baseline",
        back_populates="patient",
        cascade="all, delete-orphan",
    )
    performance_trends: Mapped[List["PerformanceTrend"]] = relationship(
        "PerformanceTrend",
        back_populates="patient",
        cascade="all, delete-orphan",
    )
    recommendations: Mapped[List["Recommendation"]] = relationship(
        "Recommendation",
        back_populates="patient",
        cascade="all, delete-orphan",
    )
    weekly_reports: Mapped[List["WeeklyReport"]] = relationship(
        "WeeklyReport",
        back_populates="patient",
        cascade="all, delete-orphan",
    )
    alerts: Mapped[List["Alert"]] = relationship(
        "Alert",
        back_populates="patient",
        cascade="all, delete-orphan",
    )
    sos_alerts: Mapped[List["SOSAlert"]] = relationship(
        "SOSAlert",
        back_populates="patient",
        cascade="all, delete-orphan",
    )
    devices: Mapped[List["Device"]] = relationship(
        "Device",
        back_populates="patient",
        cascade="all, delete-orphan",
    )
    sync_records: Mapped[List["SyncRecord"]] = relationship(
        "SyncRecord",
        back_populates="patient",
        cascade="all, delete-orphan",
    )
    ai_insights: Mapped[List["AIInsight"]] = relationship(
        "AIInsight",
        back_populates="patient",
        cascade="all, delete-orphan",
    )
