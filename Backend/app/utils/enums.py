import enum


class UserRole(str, enum.Enum):
    CAREGIVER = "CAREGIVER"
    CARETAKER = "CARETAKER"
    PATIENT = "PATIENT"
    ADMIN = "ADMIN"


class RelationshipStatus(str, enum.Enum):
    PENDING = "PENDING"
    ACTIVE = "ACTIVE"
    REJECTED = "REJECTED"
    REVOKED = "REVOKED"


class LanguageCapabilityStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    PARTIAL = "PARTIAL"
    IN_DEVELOPMENT = "IN_DEVELOPMENT"
    UNAVAILABLE = "UNAVAILABLE"


class GameCategory(str, enum.Enum):
    MEMORY = "MEMORY"
    ATTENTION = "ATTENTION"
    PATTERN_RECOGNITION = "PATTERN_RECOGNITION"
    OBJECT_RECOGNITION = "OBJECT_RECOGNITION"
    DAILY_ROUTINE_RECALL = "DAILY_ROUTINE_RECALL"
    CULTURAL = "CULTURAL"
    FAMILY = "FAMILY"


class SessionStatus(str, enum.Enum):
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    ABANDONED = "ABANDONED"


class ReminderType(str, enum.Enum):
    MEDICATION = "MEDICATION"
    HYDRATION = "HYDRATION"
    APPOINTMENT = "APPOINTMENT"
    DAILY_ACTIVITY = "DAILY_ACTIVITY"
    COGNITIVE_ACTIVITY = "COGNITIVE_ACTIVITY"


class MedicationActionType(str, enum.Enum):
    TOOK_IT = "TOOK_IT"
    REMIND_LATER = "REMIND_LATER"


class MedicationStatus(str, enum.Enum):
    SCHEDULED = "SCHEDULED"
    TAKEN = "TAKEN"
    MISSED = "MISSED"
    SNOOZED = "SNOOZED"


class SOSStatus(str, enum.Enum):
    TRIGGERED = "TRIGGERED"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    RESOLVED = "RESOLVED"


class VoiceIntent(str, enum.Enum):
    MEDICATION_SCHEDULE = "MEDICATION_SCHEDULE"
    NEXT_GAME = "NEXT_GAME"
    UPCOMING_REMINDERS = "UPCOMING_REMINDERS"
    PATIENT_PROGRESS = "PATIENT_PROGRESS"
    SOS_TRIGGER = "SOS_TRIGGER"
    GENERAL_CHAT = "GENERAL_CHAT"


class TrendDirection(str, enum.Enum):
    IMPROVING = "IMPROVING"
    STABLE = "STABLE"
    DECLINING = "DECLINING"
    INSUFFICIENT_DATA = "INSUFFICIENT_DATA"


class AlertSeverity(str, enum.Enum):
    INFO = "INFO"
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    EMERGENCY = "EMERGENCY"


class SyncOperationType(str, enum.Enum):
    CREATE = "CREATE"
    UPDATE = "UPDATE"
    DELETE = "DELETE"


class DifficultyAction(str, enum.Enum):
    INCREASE = "increase"
    MAINTAIN = "maintain"
    DECREASE = "decrease"
