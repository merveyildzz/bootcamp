from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

from app.features.wardrobe.taxonomy import TAXONOMY, Category, Color, Season, Style


class DetectedAttributes(BaseModel):
    """Gemini Vision's best-guess fields — every field is optional since the model
    may not be confident, and a flaky/failed AI call must still let the user proceed
    by filling the review form manually. Enum-typed (not plain str) so the Gemini SDK's
    structured-output constrains the model to the closed taxonomy in the first place."""

    category: Category | None = None
    color: Color | None = None
    fabric: str | None = None
    style: Style | None = None
    season: Season | None = None


class AnalyzePhotoResponse(BaseModel):
    staging_token: str
    photo_url: str
    thumbnail_url: str
    detected: DetectedAttributes


class ClothingItemCreate(BaseModel):
    staging_token: str
    category: Category
    color: Color
    fabric: str | None = Field(default=None, max_length=50)
    style: Style | None = None
    season: Season | None = None
    brand: str | None = Field(default=None, max_length=100)


class ClothingItemUpdate(BaseModel):
    category: Category | None = None
    color: Color | None = None
    fabric: str | None = Field(default=None, max_length=50)
    style: Style | None = None
    season: Season | None = None
    brand: str | None = Field(default=None, max_length=100)


class ClothingItemPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    photo_url: str
    thumbnail_url: str
    category: str
    color: str
    fabric: str | None
    style: str | None
    season: str | None
    brand: str | None
    last_worn_date: date | None
    wear_count: int
    created_at: datetime
    updated_at: datetime


class TaxonomyResponse(BaseModel):
    category: list[str] = TAXONOMY["category"]
    style: list[str] = TAXONOMY["style"]
    season: list[str] = TAXONOMY["season"]
    color: list[str] = TAXONOMY["color"]
