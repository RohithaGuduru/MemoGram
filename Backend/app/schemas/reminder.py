from datetime import datetime, time
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict

from app.utils.enums import ReminderType


class ReminderCreate(BaseModel):
    medication_id: Optional[str] = None
    title: str = Field(..., min_length=2)
    description: Optional[str] = None
    reminder_type: ReminderType = Field(default=ReminderType.DAILY_ACTIVITY)
    scheduled_time: time = Field(..., description="e.g. 09:00:00")
    recurrence_rule: str = Field(default="DAILY")
    is_active: bool = True


class ReminderUpdate(BaseModel):
    medication_id: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    reminder_type: Optional[ReminderType] = None
    scheduled_time: Optional[time] = None
    recurrence_rule: Optional[str] = None
    is_active: Optional[bool] = None


class ReminderCompleteRequest(BaseModel):
    scheduled_for: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    status: str = "COMPLETED"


class ReminderLogResponse(BaseModel):
    id: str
    reminder_id: str
    patient_id: str
    scheduled_for: datetime
    completed_at: Optional[datetime] = None
    status: str

    model_config = ConfigDict(from_attributes=True)


class ReminderResponse(BaseModel):
    id: str
    patient_id: str
    medication_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    reminder_type: ReminderType
    scheduled_time: time
    recurrence_rule: str
    is_active: bool
    last_completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
