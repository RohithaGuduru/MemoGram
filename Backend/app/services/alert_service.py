from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.alert import Alert
from app.schemas.alert import AlertResponse, AlertUpdate
from app.utils.enums import AlertSeverity


class AlertService:

    @classmethod
    def list_alerts_for_patient(
        cls,
        db: Session,
        patient_id: str,
        unread_only: bool = False,
    ) -> List[AlertResponse]:
        query = db.query(Alert).filter(Alert.patient_id == patient_id)
        if unread_only:
            query = query.filter(Alert.is_read == False)
        alerts = query.order_by(Alert.created_at.desc()).all()
        return [AlertResponse.model_validate(a) for a in alerts]

    @classmethod
    def create_alert(
        cls,
        db: Session,
        patient_id: str,
        alert_type: str,
        severity: AlertSeverity,
        title: str,
        message: str,
        metadata_info: Optional[Dict[str, Any]] = None,
    ) -> AlertResponse:
        alert = Alert(
            patient_id=patient_id,
            alert_type=alert_type,
            severity=severity,
            title=title,
            message=message,
            metadata_info=metadata_info or {},
            is_read=False,
            is_resolved=False,
            created_at=datetime.now(timezone.utc),
        )
        db.add(alert)
        db.commit()
        db.refresh(alert)
        return AlertResponse.model_validate(alert)

    @classmethod
    def mark_as_read(cls, db: Session, alert_id: str) -> AlertResponse:
        alert = db.query(Alert).filter(Alert.id == alert_id).first()
        if not alert:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")
        alert.is_read = True
        db.commit()
        db.refresh(alert)
        return AlertResponse.model_validate(alert)

    @classmethod
    def mark_as_resolved(cls, db: Session, alert_id: str) -> AlertResponse:
        alert = db.query(Alert).filter(Alert.id == alert_id).first()
        if not alert:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")
        alert.is_resolved = True
        alert.is_read = True
        alert.resolved_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(alert)
        return AlertResponse.model_validate(alert)
