from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict

from app.utils.enums import GameCategory


class DifficultyRecommendationResult(BaseModel):
    current_difficulty: int
    recommended_difficulty: int
    action: str  # 'increase', 'maintain', 'decrease'
    reason: str
    confidence: float


class RecommendationResponse(BaseModel):
    id: str
    patient_id: str
    recommended_game_id: str
    game_name: Optional[str] = None
    game_code: Optional[str] = None
    game_category: GameCategory
    target_difficulty: int
    reason: str
    confidence: float
    plan_date: date
    is_consumed: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DailyActivityItem(BaseModel):
    game_id: str
    game_name: str
    game_code: str
    type: GameCategory
    difficulty: int
    reason: str
    estimated_duration_minutes: int = 5
    is_completed: bool = False


class DailyActivityPlanResponse(BaseModel):
    patient_id: str
    date: str
    greeting: str
    activities: List[DailyActivityItem]
    daily_tip: Optional[str] = None
