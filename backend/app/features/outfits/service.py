from sqlalchemy import select
from sqlalchemy.orm import Session

from app.features.outfits.schemas import OutfitItemPublic, OutfitPublic, OutfitUpdate
from app.models.outfit import Outfit
from app.shared.exceptions import OutfitNotFoundError


def _serialize_outfit(outfit: Outfit) -> OutfitPublic:
    items = [
        OutfitItemPublic(
            id=link.clothing_item.id,
            role=link.role,
            photo_url=link.clothing_item.photo_url,
            thumbnail_url=link.clothing_item.thumbnail_url,
            category=link.clothing_item.category,
            color=link.clothing_item.color,
        )
        for link in outfit.item_links
    ]
    return OutfitPublic(
        id=outfit.id,
        name=outfit.name,
        ai_explanation=outfit.ai_explanation,
        is_favorite=outfit.is_favorite,
        event_id=outfit.event_id,
        created_at=outfit.created_at,
        items=items,
    )


def list_outfits(db: Session, user_id: int, favorites_only: bool = False) -> list[OutfitPublic]:
    stmt = select(Outfit).where(Outfit.user_id == user_id)
    if favorites_only:
        stmt = stmt.where(Outfit.is_favorite.is_(True))
    stmt = stmt.order_by(Outfit.created_at.desc())
    outfits = list(db.scalars(stmt).all())
    return [_serialize_outfit(o) for o in outfits]


def _get_owned_outfit(db: Session, user_id: int, outfit_id: int) -> Outfit:
    outfit = db.get(Outfit, outfit_id)
    if outfit is None or outfit.user_id != user_id:
        # Someone else's outfit ID 404s too, not 403 — avoids leaking whether it exists.
        raise OutfitNotFoundError()
    return outfit


def update_outfit(db: Session, user_id: int, outfit_id: int, payload: OutfitUpdate) -> OutfitPublic:
    outfit = _get_owned_outfit(db, user_id, outfit_id)
    outfit.is_favorite = payload.is_favorite
    db.commit()
    db.refresh(outfit)
    return _serialize_outfit(outfit)


def delete_outfit(db: Session, user_id: int, outfit_id: int) -> None:
    outfit = _get_owned_outfit(db, user_id, outfit_id)
    db.delete(outfit)
    db.commit()
