from datetime import date, datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict


class InsightItem(BaseModel):
    category: str
    message: str
    impact: str  # 'positive', 'neutral', 'attention_needed'


class WeeklyReportResponse(BaseModel):
    id: str
    patient_id: str
    patient_name: Optional[str] = None
    week_start_date: date
    week_end_date: date
    games_played_count: int
    activity_completion_rate: float
    average_accuracy: float
    average_response_time_ms: float
    category_summaries: Dict[str, Any]
    reminder_stats: Dict[str, Any]
    performance_trends: Dict[str, Any]
    insights: List[InsightItem]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
