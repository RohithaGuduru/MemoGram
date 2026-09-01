from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, ConfigDict

from app.utils.enums import GameCategory, SessionStatus


class GameSessionCreate(BaseModel):
    client_session_id: str = Field(..., description="Client-generated unique session UUID")
    patient_id: str = Field(..., description="Patient UUID")
    difficulty: int = Field(default=1, ge=1, le=10)
    device_id: Optional[str] = None
    started_at: Optional[datetime] = None


class GameSessionResponse(BaseModel):
    id: str
    client_session_id: str
    patient_id: str
    game_id: str
    game_category: GameCategory
    difficulty: int
    device_id: Optional[str] = None
    status: SessionStatus
    started_at: datetime
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class GameResultSubmit(BaseModel):
    total_questions: int = Field(..., ge=1, description="Total number of items/questions presented")
    correct_answers: int = Field(..., ge=0, description="Number of correct responses")
    incorrect_answers: int = Field(..., ge=0, description="Number of incorrect responses")
    errors_count: int = Field(default=0, ge=0, description="Total errors or mistakes")
    attempts_count: int = Field(default=1, ge=1, description="Number of interaction attempts")
    hints_used: int = Field(default=0, ge=0, description="Number of hints requested")
    total_time_ms: int = Field(..., ge=0, description="Total active duration in milliseconds")
    response_times: List[int] = Field(default_factory=list, description="Per-item response times in ms")
    raw_events: List[Dict[str, Any]] = Field(default_factory=list, description="Detailed interaction telemetry")
    completed_at: Optional[datetime] = None


class GameResultResponse(BaseModel):
    result_id: str
    session_id: str
    patient_id: str
    total_questions: int
    correct_answers: int
    incorrect_answers: int
    errors_count: int
    hints_used: int
    total_time_ms: int
    submitted_at: datetime
    metrics: Optional[Dict[str, Any]] = None
    baseline_comparison: Optional[Dict[str, Any]] = None
    difficulty_recommendation: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True)
