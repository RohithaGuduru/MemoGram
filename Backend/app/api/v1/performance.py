from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.performance import (
    PerformanceOverviewResponse,
    PerformanceHistoryResponse,
)
from app.services.performance_service import PerformanceService
from app.services.recommendation_service import RecommendationService
from app.core.dependencies import verify_patient_access
from app.models.patient import Patient

router = APIRouter(tags=["Performance & Trends"])


@router.get(
    "/patients/{id}/performance/overview",
    response_model=PerformanceOverviewResponse,
)
def get_performance_overview(
    id: str,
    patient: Patient = Depends(verify_patient_access),
    db: Session = Depends(get_db),
):
    """
    Returns aggregated activity performance overview:
    - Overall accuracy and response times
    - Baseline values per cognitive category
    - Trend trajectories (IMPROVING, STABLE, DECLINING)
    - Current difficulty levels
    - Recent performance logs
    """
    overview = PerformanceService.get_performance_overview(db, patient.id)
    # Attach next recommendation preview
    try:
        rec = RecommendationService.get_next_recommendation(db, patient.id)
        overview.recommended_next_activity = rec.model_dump()
    except Exception:
        pass
    return overview


@router.get(
    "/patients/{id}/performance/history",
    response_model=PerformanceHistoryResponse,
)
def get_performance_history(
    id: str,
    timeframe: str = Query("week", pattern="^(day|week|month)$"),
    patient: Patient = Depends(verify_patient_access),
    db: Session = Depends(get_db),
):
    """Returns chronological time-series data points for charting activity performance over day, week, or month."""
    return PerformanceService.get_performance_history(db, patient.id, timeframe)
