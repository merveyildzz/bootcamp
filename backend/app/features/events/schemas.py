from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


class EventType(str, Enum):
    IS_GORUSMESI = "iş görüşmesi"
    TOPLANTI = "toplantı"
    DUGUN = "düğün"
    NISAN = "nişan"
    DOGUM_GUNU = "doğum günü"
    KAHVE = "kahve"
    YEMEK_DAVETI = "yemek daveti"
    KONSER = "konser"
    SPOR_ETKINLIGI = "spor etkinliği"
    SEYAHAT = "seyahat"
    TATIL = "tatil"
    MEZUNIYET = "mezuniyet"
    RESMI_TOREN = "resmi tören"
    DIGER = "diğer"


class EventCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    event_type: EventType
    event_date: datetime
    location: str | None = Field(default=None, max_length=255)
    notes: str | None = None


class EventUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    event_type: EventType | None = None
    event_date: datetime | None = None
    location: str | None = Field(default=None, max_length=255)
    notes: str | None = None


class EventPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    event_type: str
    event_date: datetime
    location: str | None
    notes: str | None
    created_at: datetime
    updated_at: datetime
