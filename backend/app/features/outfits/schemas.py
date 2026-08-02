from datetime import datetime

from pydantic import BaseModel, ConfigDict


class OutfitItemPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    role: str | None
    photo_url: str
    thumbnail_url: str
    category: str
    color: str


class OutfitPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str | None
    ai_explanation: str | None
    is_favorite: bool
    event_id: int | None
    created_at: datetime
    items: list[OutfitItemPublic]


class OutfitUpdate(BaseModel):
    is_favorite: bool
