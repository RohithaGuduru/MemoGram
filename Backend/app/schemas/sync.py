from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from app.utils.enums import SyncOperationType


class SyncOperationItem(BaseModel):
    operation_id: str = Field(..., description="Client unique UUID for idempotent operation tracking")
    entity_type: str = Field(..., description="e.g. GAME_SESSION, GAME_RESULT, REMINDER_LOG, PATIENT_PREFS")
    entity_id: str = Field(..., description="Target entity UUID")
    operation: SyncOperationType = Field(default=SyncOperationType.CREATE)
    timestamp: datetime = Field(..., description="Time operation occurred offline on client device")
    data: Dict[str, Any] = Field(..., description="Entity payload data")


class SyncPushRequest(BaseModel):
    device_id: str = Field(..., description="Client device hardware/app UUID")
    patient_id: str = Field(..., description="Patient UUID")
    platform: Optional[str] = "android"
    app_version: Optional[str] = "1.0.0"
    operations: List[SyncOperationItem] = Field(default_factory=list)


class SyncPushResponse(BaseModel):
    processed_count: int
    successful_op_ids: List[str]
    failed_ops: List[Dict[str, Any]]
    server_time: datetime


class SyncPullRequest(BaseModel):
    patient_id: str
    device_id: str
    last_synced_at: Optional[datetime] = None


class SyncPullResponse(BaseModel):
    patient_id: str
    server_time: datetime
    games: List[Dict[str, Any]]
    active_medications: List[Dict[str, Any]]
    active_reminders: List[Dict[str, Any]]
    family_members: List[Dict[str, Any]]
    daily_activities: List[Dict[str, Any]]
    cultural_assets: List[Dict[str, Any]]
