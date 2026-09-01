from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict

from app.utils.enums import GameCategory, TrendDirection


class PerformanceMetricResponse(BaseModel):
    id: str
    session_id: str
    patient_id: str
    game_id: str
    game_category: GameCategory
    difficulty: int
    accuracy: float
    error_rate: float
    average_response_time_ms: float
    median_response_time_ms: float
    hint_rate: float
    completion_rate: float
    attempts: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BaselineResponse(BaseModel):
    id: str
    patient_id: str
    game_category: GameCategory
    difficulty_level: int
    baseline_accuracy: float
    baseline_response_time_ms: float
    baseline_error_rate: float
    baseline_hint_rate: float
    baseline_completion_rate: float
    sample_count: int
    last_updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BaselineComparison(BaseModel):
    metric: str
    current: float
    baseline: float
    change: float
    percentage_change: float
    direction: str  # 'improving', 'stable', 'declining'


class PerformanceTrendResponse(BaseModel):
    id: str
    patient_id: str
    game_category: GameCategory
    metric_name: str
    window_size: int
    previous_avg: float
    recent_avg: float
    percentage_change: float
    trend_direction: TrendDirection
    calculated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PerformanceOverviewResponse(BaseModel):
    patient_id: str
    total_sessions_completed: int
    overall_average_accuracy: float
    overall_average_response_time_ms: float
    overall_completion_rate: float
    current_difficulty_levels: Dict[str, int]
    category_baselines: Dict[str, Dict[str, float]]
    category_trends: Dict[str, Dict[str, Any]]
    recent_metrics: List[PerformanceMetricResponse]
    recommended_next_activity: Optional[Dict[str, Any]] = None


class PerformanceHistoryPoint(BaseModel):
    date: str
    session_id: str
    game_category: GameCategory
    game_name: str
    difficulty: int
    accuracy: float
    average_response_time_ms: float
    error_rate: float
    hint_rate: float


class PerformanceHistoryResponse(BaseModel):
    patient_id: str
    timeframe: str  # 'day', 'week', 'month'
    data_points: List[PerformanceHistoryPoint]
