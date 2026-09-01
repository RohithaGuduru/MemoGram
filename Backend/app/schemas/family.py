from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class FamilyMemberCreate(BaseModel):
    name: str = Field(..., min_length=2)
    relation: str = Field(..., description="e.g. Son, Daughter, Grandchild, Spouse, Friend")
    photo_url: Optional[str] = None
    phone: Optional[str] = None
    notes: Optional[str] = None
    is_emergency_contact: bool = False


class FamilyMemberUpdate(BaseModel):
    name: Optional[str] = None
    relation: Optional[str] = None
    photo_url: Optional[str] = None
    phone: Optional[str] = None
    notes: Optional[str] = None
    is_emergency_contact: Optional[bool] = None


class FamilyMemberResponse(BaseModel):
    id: str
    patient_id: str
    name: str
    relation: str
    photo_url: Optional[str] = None
    phone: Optional[str] = None
    notes: Optional[str] = None
    is_emergency_contact: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
