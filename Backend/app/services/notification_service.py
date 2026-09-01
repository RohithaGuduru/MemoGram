from datetime import datetime, timezone
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.models.user import User
from app.schemas.memogram import NotificationResponse


class NotificationService:

    @classmethod
    def list_notifications(
        cls,
        db: Session,
        current_user: User,
        unread_only: bool = False,
    ) -> List[NotificationResponse]:
        query = db.query(Notification).filter(Notification.user_id == current_user.id)
        if unread_only:
            query = query.filter(Notification.is_read == False)
        notifs = query.order_by(Notification.created_at.desc()).all()
        return [NotificationResponse.model_validate(n) for n in notifs]

    @classmethod
    def mark_as_read(cls, db: Session, current_user: User, notif_id: str) -> NotificationResponse:
        notif = db.query(Notification).filter(
            Notification.id == notif_id,
            Notification.user_id == current_user.id,
        ).first()

        if not notif:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")

        notif.is_read = True
        notif.read_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(notif)
        return NotificationResponse.model_validate(notif)
