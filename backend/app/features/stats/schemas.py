from pydantic import BaseModel, ConfigDict


class TopWornItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    category: str
    color: str
    thumbnail_url: str
    wear_count: int


class ColorUsage(BaseModel):
    color: str
    wear_count: int


class MonthlyOutfitCount(BaseModel):
    month: str
    count: int


class StatsOverview(BaseModel):
    total_items: int
    worn_items: int
    usage_rate: float
    top_worn_items: list[TopWornItem]
    color_usage: list[ColorUsage]
    monthly_outfit_counts: list[MonthlyOutfitCount]
    insights: list[str]
