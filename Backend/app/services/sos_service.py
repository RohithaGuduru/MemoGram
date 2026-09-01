from datetime import datetime, timezone
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.sos_alert import SOSAlert
from app.models.patient import Patient
from app.models.caregiver import Caregiver
from app.models.relationship import PatientCaretakerRelationship
from app.models.alert import Alert
from app.models.notification import Notification
from app.models.user import User
from app.schemas.memogram import SOSRequest, SOSResponse
from app.utils.enums import SOSStatus, RelationshipStatus, AlertSeverity, UserRole


class SOSService:

    @classmethod
    def trigger_sos(cls, db: Session, req: SOSRequest) -> SOSResponse:
        patient = db.query(Patient).filter(Patient.id == req.patient_id).first()
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found",
            )

        now = datetime.now(timezone.utc)
        sos = SOSAlert(
            patient_id=patient.id,
            status=SOSStatus.TRIGGERED,
            latitude=req.latitude,
            longitude=req.longitude,
            message=req.message or "Emergency SOS assistance requested by patient.",
            triggered_at=now,
        )
        db.add(sos)
        db.flush()

        patient_name = patient.user.full_name if patient.user else "Patient"

        # Find active caretakers
        relationships = db.query(PatientCaretakerRelationship).filter(
            PatientCaretakerRelationship.patient_id == patient.id,
            PatientCaretakerRelationship.status == RelationshipStatus.ACTIVE,
        ).all()

        # Dispatch alerts and in-app notifications
        for rel in relationships:
            if rel.caregiver and rel.caregiver.user_id:
                # 1. In-app notification
                notif = Notification(
                    user_id=rel.caregiver.user_id,
                    title="EMERGENCY SOS ALERT",
                    body=f"Emergency SOS triggered by {patient_name}!",
                    notification_type="SOS",
                    metadata_info={
                        "sos_id": sos.id,
                        "patient_id": patient.id,
                        "latitude": req.latitude,
                        "longitude": req.longitude,
                    },
                    created_at=now,
                )
                db.add(notif)

        # 2. Caregiver Alert record
        cg_alert = Alert(
            patient_id=patient.id,
            alert_type="SOS_TRIGGERED",
            severity=AlertSeverity.HIGH,
            title="EMERGENCY SOS TRIGGERED",
            message=f"{patient_name} pressed the Emergency SOS button.",
            metadata_info={"sos_id": sos.id, "coords": {"lat": req.latitude, "lng": req.longitude}},
            created_at=now,
        )
        db.add(cg_alert)

        db.commit()
        db.refresh(sos)

        return SOSResponse(
            id=sos.id,
            patient_id=sos.patient_id,
            patient_name=patient_name,
            status=sos.status,
            latitude=sos.latitude,
            longitude=sos.longitude,
            message=sos.message,
            triggered_at=sos.triggered_at,
            resolved_at=sos.resolved_at,
        )

    @classmethod
    def list_sos_alerts(
        cls,
        db: Session,
        current_user: User,
        active_only: bool = False,
    ) -> List[SOSResponse]:
        if current_user.role in [UserRole.CAREGIVER, UserRole.CARETAKER]:
            caregiver = db.query(Caregiver).filter(Caregiver.user_id == current_user.id).first()
            if not caregiver:
                return []
            patient_ids = [
                r.patient_id for r in db.query(PatientCaretakerRelationship).filter(
                    PatientCaretakerRelationship.caregiver_id == caregiver.id,
                    PatientCaretakerRelationship.status == RelationshipStatus.ACTIVE,
                ).all()
            ]
            query = db.query(SOSAlert).filter(SOSAlert.patient_id.in_(patient_ids))
        elif current_user.role == UserRole.PATIENT:
            patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
            if not patient:
                return []
            query = db.query(SOSAlert).filter(SOSAlert.patient_id == patient.id)
        else:
            query = db.query(SOSAlert)

        if active_only:
            query = query.filter(SOSAlert.status != SOSStatus.RESOLVED)

        alerts = query.order_by(SOSAlert.triggered_at.desc()).all()
        responses = []
        for a in alerts:
            p_name = a.patient.user.full_name if a.patient and a.patient.user else "Patient"
            responses.append(
                SOSResponse(
                    id=a.id,
                    patient_id=a.patient_id,
                    patient_name=p_name,
                    status=a.status,
                    latitude=a.latitude,
                    longitude=a.longitude,
                    message=a.message,
                    triggered_at=a.triggered_at,
                    resolved_at=a.resolved_at,
                )
            )
        return responses

    @classmethod
    def resolve_sos(cls, db: Session, sos_id: str) -> SOSResponse:
        sos = db.query(SOSAlert).filter(SOSAlert.id == sos_id).first()
        if not sos:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="SOS alert not found")

        now = datetime.now(timezone.utc)
        sos.status = SOSStatus.RESOLVED
        sos.resolved_at = now
        db.commit()
        db.refresh(sos)

        p_name = sos.patient.user.full_name if sos.patient and sos.patient.user else "Patient"
        return SOSResponse(
            id=sos.id,
            patient_id=sos.patient_id,
            patient_name=p_name,
            status=sos.status,
            latitude=sos.latitude,
            longitude=sos.longitude,
            message=sos.message,
            triggered_at=sos.triggered_at,
            resolved_at=sos.resolved_at,
        )
