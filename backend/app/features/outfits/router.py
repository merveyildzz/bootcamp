from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.features.outfits import service
from app.features.outfits.schemas import OutfitPublic, OutfitUpdate
from app.models.user import User
from app.shared.exceptions import AppError

router = APIRouter(prefix="/outfits", tags=["outfits"], dependencies=[Depends(get_current_user)])


@router.get("", response_model=list[OutfitPublic])
def list_outfits(
    favorite: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.list_outfits(db, current_user.id, favorites_only=favorite)


@router.patch("/{outfit_id}", response_model=OutfitPublic)
def update_outfit(
    outfit_id: int,
    payload: OutfitUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.update_outfit(db, current_user.id, outfit_id, payload)
    except AppError as exc:
        raise exc.to_http_exception()


@router.delete("/{outfit_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_outfit(
    outfit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        service.delete_outfit(db, current_user.id, outfit_id)
    except AppError as exc:
        raise exc.to_http_exception()
