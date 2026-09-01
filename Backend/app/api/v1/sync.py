from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.sync import (
    SyncPushRequest,
    SyncPushResponse,
    SyncPullRequest,
    SyncPullResponse,
)
from app.services.sync_service import SyncService
from app.core.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/sync", tags=["Offline Sync"])


@router.post("/push", response_model=SyncPushResponse)
def push_offline_sync_batch(
    req: SyncPushRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Ingests batch of offline operations recorded on the Flutter client (SQLite).
    Guarantees idempotency via unique operation IDs.
    Supports offline game sessions, results, reminder completions, and preference updates.
    """
    return SyncService.process_push_batch(db, req)


@router.post("/pull", response_model=SyncPullResponse)
def pull_delta_sync(
    req: SyncPullRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Pulls authoritative data and updates from backend to SQLite client:
    - Active game catalog & configurations
    - Active medications & reminders
    - Family contacts
    - Daily personalized activities
    - Cultural media assets for regional localization
    """
    return SyncService.pull_patient_delta(db, req)
