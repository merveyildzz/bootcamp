from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.clothing_item import ClothingItem
    from app.models.event import Event
    from app.models.user import User


class Outfit(TimestampMixin, Base):
    __tablename__ = "outfits"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    event_id: Mapped[int | None] = mapped_column(ForeignKey("events.id"), nullable=True, index=True)
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    ai_explanation: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_favorite: Mapped[bool] = mapped_column(default=False, server_default="0")

    user: Mapped["User"] = relationship(back_populates="outfits")
    event: Mapped["Event | None"] = relationship(back_populates="outfits")
    item_links: Mapped[list["OutfitItem"]] = relationship(back_populates="outfit", cascade="all, delete-orphan")


class OutfitItem(Base):
    """Association object (not a plain Table) so a `role`/slot label (e.g. 'top', 'bottom', 'shoes')
    can be attached to each outfit <-> clothing_item pairing."""

    __tablename__ = "outfit_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    outfit_id: Mapped[int] = mapped_column(ForeignKey("outfits.id"), nullable=False, index=True)
    clothing_item_id: Mapped[int] = mapped_column(ForeignKey("clothing_items.id"), nullable=False, index=True)
    role: Mapped[str | None] = mapped_column(String(50), nullable=True)

    outfit: Mapped["Outfit"] = relationship(back_populates="item_links")
    clothing_item: Mapped["ClothingItem"] = relationship(back_populates="outfit_links")
