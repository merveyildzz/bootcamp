from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ConversationPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str | None
    created_at: datetime
    updated_at: datetime


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
    ai_explanation: str | None
    items: list[OutfitItemPublic]


class ChatMessagePublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    role: str
    content: str
    outfit: OutfitPublic | None
    created_at: datetime


class SendMessageRequest(BaseModel):
    content: str = Field(min_length=1, max_length=2000)
    lat: float | None = None
    lon: float | None = None
    city: str | None = None
