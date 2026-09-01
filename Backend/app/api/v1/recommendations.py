from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.recommendation import RecommendationResponse
from app.services.recommendation_service import RecommendationService
from app.core.dependencies import verify_patient_access
from app.models.patient import Patient

router = APIRouter(tags=["Recommendations"])


@router.get(
    "/patients/{id}/recommendations/next",
    response_model=RecommendationResponse,
)
def get_next_activity_recommendation(
    id: str,
    patient: Patient = Depends(verify_patient_access),
    db: Session = Depends(get_db),
):
    """
    Evaluates patient activity history, category recency, and adaptive difficulty
    to select the best next activity with an explainable non-medical rationale.
    """
    return RecommendationService.get_next_recommendation(db, patient.id)
