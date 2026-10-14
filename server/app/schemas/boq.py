from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class BoqCreate(BaseModel):
    name: str = Field(min_length=3, max_length=255)
    description: str | None = None


class BoqRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    name: str
    description: str | None
    status: str
    created_at: datetime
    updated_at: datetime
    positions: int = 0
    total_value: float = 0
    currency: str = "ETB"