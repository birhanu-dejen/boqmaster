from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ProjectCreate(BaseModel):
    name: str = Field(min_length=3, max_length=255)
    client: str = Field(min_length=1, max_length=255)
    location: str = Field(min_length=1, max_length=255)
    description: str | None = None


class ProjectRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    client_name: str | None
    location: str | None
    description: str | None
    status: str
    owner_id: int
    created_at: datetime