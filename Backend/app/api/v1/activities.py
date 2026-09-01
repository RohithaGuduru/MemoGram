from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.recommendation import DailyActivityPlanResponse
from app.services.recommendation_service import RecommendationService
from app.core.dependencies import verify_patient_access
from app.models.patient import Patient

router = APIRouter(tags=["Daily Activities"])


@router.get(
    "/patients/{id}/activities/today",
    response_model=DailyActivityPlanResponse,
)
def get_daily_activity_plan(
    id: str,
    patient: Patient = Depends(verify_patient_access),
    db: Session = Depends(get_db),
):
    """
    Returns a personalized daily activity schedule designed for the patient.
    Balances memory, attention, pattern recognition, and routine recall exercises.
    """
    return RecommendationService.get_daily_activity_plan(db, patient.id)
