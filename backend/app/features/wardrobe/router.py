from fastapi import APIRouter, Depends, File, UploadFile, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.features.wardrobe import service
from app.features.wardrobe.schemas import (
    AnalyzePhotoResponse,
    ClothingItemCreate,
    ClothingItemPublic,
    ClothingItemUpdate,
    TaxonomyResponse,
)
from app.models.user import User
from app.shared.exceptions import AppError

router = APIRouter(prefix="/wardrobe", tags=["wardrobe"])


@router.get("/taxonomy", response_model=TaxonomyResponse)
def get_taxonomy():
    return TaxonomyResponse()


@router.post("/analyze", response_model=AnalyzePhotoResponse)
async def analyze_photo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    raw_bytes = await file.read()
    try:
        return service.analyze_photo(raw_bytes)
    except AppError as exc:
        raise exc.to_http_exception()


@router.post("/items", response_model=ClothingItemPublic, status_code=status.HTTP_201_CREATED)
def create_item(
    payload: ClothingItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.create_item(db, current_user.id, payload)
    except AppError as exc:
        raise exc.to_http_exception()


@router.get("/items", response_model=list[ClothingItemPublic])
def list_items(
    category: str | None = None,
    color: str | None = None,
    season: str | None = None,
    style: str | None = None,
    search: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.list_items(db, current_user.id, category, color, season, style, search)


@router.get("/items/{item_id}", response_model=ClothingItemPublic)
def get_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.get_item(db, current_user.id, item_id)
    except AppError as exc:
        raise exc.to_http_exception()


@router.patch("/items/{item_id}", response_model=ClothingItemPublic)
def update_item(
    item_id: int,
    payload: ClothingItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.update_item(db, current_user.id, item_id, payload)
    except AppError as exc:
        raise exc.to_http_exception()


@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        service.delete_item(db, current_user.id, item_id)
    except AppError as exc:
        raise exc.to_http_exception()


@router.post("/items/{item_id}/wear", response_model=ClothingItemPublic)
def mark_worn(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.mark_worn(db, current_user.id, item_id)
    except AppError as exc:
        raise exc.to_http_exception()
