from sqlalchemy import select
from sqlalchemy.orm import Session

from app.features.events.schemas import EventCreate, EventUpdate
from app.models.event import Event
from app.shared.exceptions import EventNotFoundError


def create_event(db: Session, user_id: int, payload: EventCreate) -> Event:
    event = Event(
        user_id=user_id,
        title=payload.title,
        event_type=payload.event_type,
        event_date=payload.event_date,
        location=payload.location,
        notes=payload.notes,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


def list_events(db: Session, user_id: int) -> list[Event]:
    stmt = select(Event).where(Event.user_id == user_id).order_by(Event.event_date.asc())
    return list(db.scalars(stmt).all())


def _get_owned_event(db: Session, user_id: int, event_id: int) -> Event:
    event = db.get(Event, event_id)
    if event is None or event.user_id != user_id:
        # Someone else's event ID 404s too, not 403 — avoids leaking whether it exists.
        raise EventNotFoundError()
    return event


def get_event(db: Session, user_id: int, event_id: int) -> Event:
    return _get_owned_event(db, user_id, event_id)


def update_event(db: Session, user_id: int, event_id: int, payload: EventUpdate) -> Event:
    event = _get_owned_event(db, user_id, event_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(event, field, value)
    db.commit()
    db.refresh(event)
    return event


def delete_event(db: Session, user_id: int, event_id: int) -> None:
    event = _get_owned_event(db, user_id, event_id)
    db.delete(event)
    db.commit()
