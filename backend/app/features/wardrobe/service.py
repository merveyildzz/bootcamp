import logging
from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.features.wardrobe import gemini_client, image_utils
from app.features.wardrobe.schemas import (
    AnalyzePhotoResponse,
    ClothingItemCreate,
    ClothingItemUpdate,
    DetectedAttributes,
)
from app.models.clothing_item import ClothingItem
from app.shared.exceptions import ClothingItemNotFoundError

logger = logging.getLogger(__name__)


def analyze_photo(raw_bytes: bytes) -> AnalyzePhotoResponse:
    image_utils.cleanup_stale_staging_files()
    processed = image_utils.validate_and_process_image(raw_bytes)
    staging_token, photo_url, thumbnail_url = image_utils.save_staged(processed)

    try:
        detected = gemini_client.analyze_clothing_image(processed.bytes_, processed.mime_type)
    except Exception:
        # A flaky/misconfigured Gemini call must never block the upload — the user
        # just gets an empty review form to fill in by hand instead of a pre-filled one.
        # Still logged (not silenced) so a broken API key/model doesn't go unnoticed.
        logger.exception("Gemini photo analysis failed; falling back to empty detected fields")
        detected = DetectedAttributes()

    return AnalyzePhotoResponse(
        staging_token=staging_token,
        photo_url=photo_url,
        thumbnail_url=thumbnail_url,
        detected=detected,
    )


def create_item(db: Session, user_id: int, payload: ClothingItemCreate) -> ClothingItem:
    photo_url = image_utils.promote_staged_to_permanent(payload.staging_token)

    item = ClothingItem(
        user_id=user_id,
        photo_url=photo_url,
        category=payload.category,
        color=payload.color,
        fabric=payload.fabric,
        style=payload.style,
        season=payload.season,
        brand=payload.brand,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def list_items(
    db: Session,
    user_id: int,
    category: str | None = None,
    color: str | None = None,
    season: str | None = None,
    style: str | None = None,
    search: str | None = None,
) -> list[ClothingItem]:
    stmt = select(ClothingItem).where(ClothingItem.user_id == user_id)
    if category:
        stmt = stmt.where(ClothingItem.category == category)
    if color:
        stmt = stmt.where(ClothingItem.color == color)
    if season:
        stmt = stmt.where(ClothingItem.season == season)
    if style:
        stmt = stmt.where(ClothingItem.style == style)
    if search:
        pattern = f"%{search}%"
        stmt = stmt.where(
            ClothingItem.brand.ilike(pattern) | ClothingItem.category.ilike(pattern) | ClothingItem.color.ilike(pattern)
        )
    stmt = stmt.order_by(ClothingItem.created_at.desc())
    return list(db.scalars(stmt).all())


def _get_owned_item(db: Session, user_id: int, item_id: int) -> ClothingItem:
    item = db.get(ClothingItem, item_id)
    if item is None or item.user_id != user_id:
        # Someone else's item ID 404s too, not 403 — avoids leaking whether it exists.
        raise ClothingItemNotFoundError()
    return item


def get_item(db: Session, user_id: int, item_id: int) -> ClothingItem:
    return _get_owned_item(db, user_id, item_id)


def update_item(db: Session, user_id: int, item_id: int, payload: ClothingItemUpdate) -> ClothingItem:
    item = _get_owned_item(db, user_id, item_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    db.commit()
    db.refresh(item)
    return item


def delete_item(db: Session, user_id: int, item_id: int) -> None:
    item = _get_owned_item(db, user_id, item_id)
    image_utils.delete_permanent_files(item.photo_url)
    db.delete(item)
    db.commit()


def mark_worn(db: Session, user_id: int, item_id: int) -> ClothingItem:
    item = _get_owned_item(db, user_id, item_id)
    item.wear_count += 1
    item.last_worn_date = date.today()
    db.commit()
    db.refresh(item)
    return item
