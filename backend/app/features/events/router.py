from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.features.events import service
from app.features.events.schemas import EventCreate, EventPublic, EventUpdate
from app.models.user import User
from app.shared.exceptions import AppError

router = APIRouter(prefix="/events", tags=["events"], dependencies=[Depends(get_current_user)])


@router.post("", response_model=EventPublic, status_code=status.HTTP_201_CREATED)
def create_event(
    payload: EventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.create_event(db, current_user.id, payload)


@router.get("", response_model=list[EventPublic])
def list_events(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.list_events(db, current_user.id)


@router.get("/{event_id}", response_model=EventPublic)
def get_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.get_event(db, current_user.id, event_id)
    except AppError as exc:
        raise exc.to_http_exception()


@router.patch("/{event_id}", response_model=EventPublic)
def update_event(
    event_id: int,
    payload: EventUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.update_event(db, current_user.id, event_id, payload)
    except AppError as exc:
        raise exc.to_http_exception()


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        service.delete_event(db, current_user.id, event_id)
    except AppError as exc:
        raise exc.to_http_exception()
