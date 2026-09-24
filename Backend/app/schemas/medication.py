from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class MedicationCreate(BaseModel):
    name: str = Field(..., min_length=2)
    dosage: str = Field(..., description="e.g. 10mg, 1 tablet")
    time_of_day: str = Field(..., description="e.g. 08:00 AM, After dinner")
    frequency: str = Field(default="daily", description="e.g. daily, twice_daily, weekly")
    start_date: date = Field(default_factory=date.today, description="Start date of medication course")
    end_date: Optional[date] = None
    instructions: Optional[str] = None
    photo_url: Optional[str] = None
    is_active: bool = True


class MedicationUpdate(BaseModel):
    name: Optional[str] = None
    dosage: Optional[str] = None
    time_of_day: Optional[str] = None
    frequency: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    instructions: Optional[str] = None
    photo_url: Optional[str] = None
    is_active: Optional[bool] = None


class MedicationResponse(BaseModel):
    id: str
    patient_id: str
    name: str
    dosage: str
    time_of_day: str
    frequency: str
    start_date: date
    end_date: Optional[date] = None
    instructions: Optional[str] = None
    photo_url: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
