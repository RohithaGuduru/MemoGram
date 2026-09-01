from datetime import datetime
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field, ConfigDict

from app.utils.enums import GameCategory


class GameCreate(BaseModel):
    code: str = Field(..., description="Unique game identifier, e.g. MEM_PHOTO_RECALL")
    name: str = Field(..., min_length=2)
    category: GameCategory
    description: str
    min_difficulty: int = Field(default=1, ge=1)
    max_difficulty: int = Field(default=5, le=10)
    default_config: Dict[str, Any] = Field(default_factory=dict)
    metadata_info: Dict[str, Any] = Field(default_factory=dict)
    is_active: bool = True


class GameUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    min_difficulty: Optional[int] = None
    max_difficulty: Optional[int] = None
    default_config: Optional[Dict[str, Any]] = None
    metadata_info: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None


class GameResponse(BaseModel):
    id: str
    code: str
    name: str
    category: GameCategory
    description: str
    min_difficulty: int
    max_difficulty: int
    default_config: Dict[str, Any]
    metadata_info: Dict[str, Any]
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
