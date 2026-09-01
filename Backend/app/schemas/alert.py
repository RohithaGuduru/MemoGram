from datetime import datetime
from typing import Any, Dict, Optional
from pydantic import BaseModel, ConfigDict

from app.utils.enums import AlertSeverity


class AlertResponse(BaseModel):
    id: str
    patient_id: str
    patient_name: Optional[str] = None
    alert_type: str
    severity: AlertSeverity
    title: str
    message: str
    metadata_info: Dict[str, Any]
    is_read: bool
    is_resolved: bool
    created_at: datetime
    resolved_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class AlertUpdate(BaseModel):
    is_read: Optional[bool] = None
    is_resolved: Optional[bool] = None
