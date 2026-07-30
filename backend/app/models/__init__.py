"""Import every model here so Alembic autogenerate (and SQLAlchemy's mapper
configuration for string-based relationship() references) can see them all."""

from app.models.chat_message import ChatMessage
from app.models.clothing_item import ClothingItem
from app.models.conversation import Conversation
from app.models.event import Event
from app.models.outfit import Outfit, OutfitItem
from app.models.refresh_token import RefreshToken
from app.models.user import User

__all__ = ["User", "ClothingItem", "Outfit", "OutfitItem", "Event", "RefreshToken", "Conversation", "ChatMessage"]
