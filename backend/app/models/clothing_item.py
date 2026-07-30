from datetime import date
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.outfit import OutfitItem
    from app.models.user import User


class ClothingItem(TimestampMixin, Base):
    """Category/style/season/brand are plain strings validated at the app layer
    (via Python Enums in Faz 2), not DB constraints — SQLite has no native enum type,
    and this keeps adding a new category a code change, not a migration."""

    __tablename__ = "clothing_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    photo_url: Mapped[str] = mapped_column(String(500), nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    color: Mapped[str] = mapped_column(String(50), nullable=False)
    fabric: Mapped[str | None] = mapped_column(String(50), nullable=True)
    style: Mapped[str | None] = mapped_column(String(50), nullable=True)
    season: Mapped[str | None] = mapped_column(String(50), nullable=True)
    brand: Mapped[str | None] = mapped_column(String(100), nullable=True)
    last_worn_date: Mapped[date | None] = mapped_column(nullable=True)
    wear_count: Mapped[int] = mapped_column(default=0, server_default="0")

    user: Mapped["User"] = relationship(back_populates="clothing_items")
    outfit_links: Mapped[list["OutfitItem"]] = relationship(
        back_populates="clothing_item", cascade="all, delete-orphan"
    )

    @property
    def thumbnail_url(self) -> str:
        """Derived by filename convention (no DB column) — see image_utils.thumbnail_path_for."""
        stem, _, ext = self.photo_url.rpartition(".")
        return f"{stem}_thumb.{ext}"
