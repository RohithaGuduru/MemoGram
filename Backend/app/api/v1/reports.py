from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.report import WeeklyReportResponse
from app.services.report_service import ReportService
from app.core.dependencies import verify_patient_access
from app.models.patient import Patient

router = APIRouter(tags=["Reports"])


@router.get(
    "/patients/{id}/reports/weekly",
    response_model=WeeklyReportResponse,
)
def get_weekly_report(
    id: str,
    target_date: Optional[date] = Query(None, description="Date within target week (YYYY-MM-DD)"),
    patient: Patient = Depends(verify_patient_access),
    db: Session = Depends(get_db),
):
    """
    Returns or computes a weekly cognitive activity performance summary:
    - Games played and activity completion
    - Average accuracy and response pacing
    - Category domain breakdown (Memory, Attention, Pattern Recognition)
    - Routine and reminder consistency
    - Compassionate, explainable AI activity insights
    """
    return ReportService.get_or_generate_weekly_report(db, patient.id, target_date)
