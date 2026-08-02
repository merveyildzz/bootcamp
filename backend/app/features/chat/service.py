import logging
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.features.chat import gemini_client
from app.features.chat.schemas import ChatMessagePublic, OutfitItemPublic, OutfitPublic, SendMessageRequest
from app.features.wardrobe import service as wardrobe_service
from app.features.weather import service as weather_service
from app.models.chat_message import ChatMessage
from app.models.conversation import Conversation
from app.models.event import Event
from app.models.outfit import Outfit, OutfitItem
from app.models.user import User
from app.shared.exceptions import AppError, ChatServiceUnavailableError, ConversationNotFoundError

logger = logging.getLogger(__name__)

HISTORY_LIMIT = 10
UPCOMING_EVENTS_LIMIT = 5
TITLE_MAX_LENGTH = 40


def list_conversations(db: Session, user_id: int) -> list[Conversation]:
    stmt = select(Conversation).where(Conversation.user_id == user_id).order_by(Conversation.updated_at.desc())
    return list(db.scalars(stmt).all())


def _first_name(user: User) -> str:
    return user.full_name.split(" ")[0]


def _fallback_greeting_message(db: Session, user: User) -> str:
    """Used when Gemini is unavailable (no/invalid API key, network error) — keeps the
    app usable without AI, see gemini_client.get_opening_message for the normal path."""
    first_name = _first_name(user)
    item_count = len(wardrobe_service.list_items(db, user.id))

    if item_count == 0:
        return (
            f"Merhaba {first_name}! Ben senin kişisel stil asistanınım 👋 Henüz dolabına kıyafet eklemedin — "
            "birkaç parça eklersen sana özel kombin önerileri sunabilirim. Bu arada tarzın ya da bugün ne "
            "giymek istediğin hakkında yine de sohbet edebiliriz."
        )
    return (
        f"Merhaba {first_name}! Ben senin kişisel stil asistanınım 👋 Dolabında {item_count} parça var. "
        "Bugün ne yapıyorsun, nasıl geçiyor günün? Sohbet ede ede senin için en uygun kombini birlikte "
        "bulalım."
    )


def _opening_message(db: Session, user: User) -> str:
    try:
        return gemini_client.get_opening_message(_first_name(user), _wardrobe_context(db, user.id))
    except Exception:
        logger.exception("Gemini opening message failed")
        return _fallback_greeting_message(db, user)


def create_conversation(db: Session, user: User) -> Conversation:
    conversation = Conversation(user_id=user.id, title=None)
    db.add(conversation)
    db.flush()

    db.add(ChatMessage(conversation_id=conversation.id, role="assistant", content=_opening_message(db, user)))
    db.commit()
    db.refresh(conversation)
    return conversation


def _get_owned_conversation(db: Session, user_id: int, conversation_id: int) -> Conversation:
    conversation = db.get(Conversation, conversation_id)
    if conversation is None or conversation.user_id != user_id:
        raise ConversationNotFoundError()
    return conversation


def delete_conversation(db: Session, user_id: int, conversation_id: int) -> None:
    conversation = _get_owned_conversation(db, user_id, conversation_id)
    db.delete(conversation)
    db.commit()


def list_messages(db: Session, user_id: int, conversation_id: int) -> list[ChatMessagePublic]:
    conversation = _get_owned_conversation(db, user_id, conversation_id)
    return [_serialize_message(m) for m in conversation.messages]


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
    return OutfitPublic(id=outfit.id, ai_explanation=outfit.ai_explanation, items=items)


def _serialize_message(message: ChatMessage) -> ChatMessagePublic:
    return ChatMessagePublic(
        id=message.id,
        role=message.role,
        content=message.content,
        outfit=_serialize_outfit(message.outfit) if message.outfit else None,
        created_at=message.created_at,
    )


def _wardrobe_context(db: Session, user_id: int) -> str:
    items = wardrobe_service.list_items(db, user_id)
    if not items:
        return "Gardırop boş, henüz hiç kıyafet eklenmemiş."

    lines = []
    for item in items:
        details = [item.category, item.color]
        if item.style:
            details.append(item.style)
        if item.season:
            details.append(item.season)
        if item.fabric:
            details.append(item.fabric)
        if item.brand:
            details.append(f"marka {item.brand}")
        details.append(f"{item.wear_count} kez giyildi")
        details.append(f"son giyilme: {item.last_worn_date.isoformat()}" if item.last_worn_date else "hiç giyilmedi")
        lines.append(f"- item_id={item.id}: {', '.join(details)}")
    return "\n".join(lines)


def _weather_context(payload: SendMessageRequest) -> str | None:
    try:
        if payload.city:
            weather = weather_service.get_weather_for_city(payload.city)
        elif payload.lat is not None and payload.lon is not None:
            weather = weather_service.get_weather_for_coordinates(payload.lat, payload.lon)
        else:
            return None
    except AppError:
        # Weather is optional chat context — never block the conversation over it.
        return None

    location = f" ({weather.location_name})" if weather.location_name else ""
    return f"{weather.temperature:.0f}°C, {weather.condition}{location}"


def _upcoming_events_context(db: Session, user_id: int) -> str:
    stmt = (
        select(Event)
        .where(Event.user_id == user_id, Event.event_date >= datetime.now())
        .order_by(Event.event_date)
        .limit(UPCOMING_EVENTS_LIMIT)
    )
    events = list(db.scalars(stmt).all())
    if not events:
        return ""

    lines = []
    for event in events:
        details = f"{event.title} ({event.event_type}), {event.event_date.date().isoformat()}"
        if event.location:
            details += f", {event.location}"
        lines.append(f"- {details}")
    return "\n".join(lines)


def send_message(db: Session, user: User, conversation_id: int, payload: SendMessageRequest) -> ChatMessagePublic:
    conversation = _get_owned_conversation(db, user.id, conversation_id)

    is_first_user_message = not any(m.role == "user" for m in conversation.messages)
    history = [(m.role, m.content) for m in conversation.messages[-HISTORY_LIMIT:]]

    user_message = ChatMessage(conversation_id=conversation.id, role="user", content=payload.content)
    db.add(user_message)
    db.commit()

    try:
        reply = gemini_client.get_chat_reply(
            user_first_name=_first_name(user),
            wardrobe_context=_wardrobe_context(db, user.id),
            weather_context=_weather_context(payload),
            events_context=_upcoming_events_context(db, user.id),
            history=history,
            new_message=payload.content,
        )
    except Exception as exc:
        logger.exception("Gemini chat reply failed")
        raise ChatServiceUnavailableError() from exc

    outfit = None
    if reply.outfit_items:
        owned_item_ids = {item.id for item in wardrobe_service.list_items(db, user.id)}
        valid_suggestions = [s for s in reply.outfit_items if s.item_id in owned_item_ids]
        if valid_suggestions:
            outfit = Outfit(user_id=user.id, ai_explanation=reply.outfit_explanation)
            db.add(outfit)
            db.flush()
            for suggestion in valid_suggestions:
                db.add(OutfitItem(outfit_id=outfit.id, clothing_item_id=suggestion.item_id, role=suggestion.role))

    assistant_message = ChatMessage(
        conversation_id=conversation.id,
        role="assistant",
        content=reply.message,
        outfit_id=outfit.id if outfit else None,
    )
    db.add(assistant_message)

    if is_first_user_message and conversation.title is None:
        conversation.title = payload.content[:TITLE_MAX_LENGTH]

    db.commit()
    db.refresh(assistant_message)
    return _serialize_message(assistant_message)
