from datetime import date

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.features.stats.schemas import ColorUsage, MonthlyOutfitCount, StatsOverview, TopWornItem
from app.models.clothing_item import ClothingItem
from app.models.outfit import Outfit

MONTHLY_WINDOW = 6
TOP_ITEMS_LIMIT = 5


def _last_n_months(n: int) -> list[str]:
    today = date.today()
    year, month = today.year, today.month
    months = []
    for _ in range(n):
        months.append(f"{year:04d}-{month:02d}")
        month -= 1
        if month == 0:
            month, year = 12, year - 1
    return list(reversed(months))


def _monthly_outfit_counts(db: Session, user_id: int) -> list[MonthlyOutfitCount]:
    stmt = (
        select(func.strftime("%Y-%m", Outfit.created_at), func.count())
        .where(Outfit.user_id == user_id)
        .group_by(func.strftime("%Y-%m", Outfit.created_at))
    )
    counts_by_month = dict(db.execute(stmt).all())
    # Filled with 0 for months with no outfits — so the chart never shows a gap.
    return [
        MonthlyOutfitCount(month=month, count=counts_by_month.get(month, 0)) for month in _last_n_months(MONTHLY_WINDOW)
    ]


def _build_insights(
    total_items: int,
    unworn_items: int,
    top_worn_items: list[TopWornItem],
    color_usage: list[ColorUsage],
) -> list[str]:
    insights = []
    if color_usage:
        insights.append(f"En çok {color_usage[0].color} tonlarını tercih ediyorsun.")
    if unworn_items > 0:
        insights.append(f"{unworn_items} parçayı henüz hiç giymedin, bir şans ver?")
    if top_worn_items:
        least_worn_of_top = top_worn_items[-1]
        insights.append(
            f"{least_worn_of_top.category} ({least_worn_of_top.color}) favorilerin arasında ama en az giyilen — "
            "tekrar dener misin?"
        )
    return insights


def get_overview(db: Session, user_id: int) -> StatsOverview:
    items = list(db.scalars(select(ClothingItem).where(ClothingItem.user_id == user_id)).all())
    total_items = len(items)
    worn_items = sum(1 for item in items if item.wear_count > 0)
    usage_rate = worn_items / total_items if total_items > 0 else 0.0

    top_worn_items = [
        TopWornItem.model_validate(item)
        for item in sorted((i for i in items if i.wear_count > 0), key=lambda i: i.wear_count, reverse=True)[
            :TOP_ITEMS_LIMIT
        ]
    ]

    color_totals: dict[str, int] = {}
    for item in items:
        color_totals[item.color] = color_totals.get(item.color, 0) + item.wear_count
    color_usage = [
        ColorUsage(color=color, wear_count=count)
        for color, count in sorted(color_totals.items(), key=lambda kv: kv[1], reverse=True)
        if count > 0
    ]

    monthly_outfit_counts = _monthly_outfit_counts(db, user_id)
    insights = _build_insights(total_items, total_items - worn_items, top_worn_items, color_usage)

    return StatsOverview(
        total_items=total_items,
        worn_items=worn_items,
        usage_rate=usage_rate,
        top_worn_items=top_worn_items,
        color_usage=color_usage,
        monthly_outfit_counts=monthly_outfit_counts,
        insights=insights,
    )
