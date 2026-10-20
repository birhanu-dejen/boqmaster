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


class PositionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    section_id: int
    ordinal: str
    description: str
    unit: str
    quantity: float
    unit_rate: float


class PositionCreate(BaseModel):
    ordinal: str = Field(min_length=1, max_length=32)
    description: str = ""
    unit: str = ""
    quantity: float = Field(default=0, ge=0)
    unit_rate: float = Field(default=0, ge=0)


class PositionUpdate(BaseModel):
    ordinal: str | None = Field(default=None, min_length=1, max_length=32)
    description: str | None = None
    unit: str | None = None
    quantity: float | None = Field(default=None, ge=0)
    unit_rate: float | None = Field(default=None, ge=0)


class SectionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    boq_id: int
    parent_id: int | None
    ordinal: str
    title: str
    positions: list[PositionRead]


class SectionCreate(BaseModel):
    ordinal: str = Field(min_length=1, max_length=20)
    title: str = ""
    parent_id: int | None = None


class SectionUpdate(BaseModel):
    ordinal: str | None = Field(default=None, min_length=1, max_length=20)
    title: str | None = None


class SectionOrderItem(BaseModel):
    id: int
    parent_id: int | None = None


class SectionReorder(BaseModel):
    items: list[SectionOrderItem]


class BoqDetail(BoqRead):
    sections: list[SectionRead]
