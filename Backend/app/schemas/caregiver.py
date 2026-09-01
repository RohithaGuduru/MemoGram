from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict


class CaregiverCreate(BaseModel):
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    password: str = Field(..., min_length=6)
    full_name: str
    agency: Optional[str] = None
    notes: Optional[str] = None


class CaregiverUpdate(BaseModel):
    agency: Optional[str] = None
    notes: Optional[str] = None


class CaregiverResponse(BaseModel):
    id: str
    user_id: str
    full_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    agency: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
