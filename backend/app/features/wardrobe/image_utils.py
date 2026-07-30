import io
import time
import uuid
from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageOps

from app.core.config import settings
from app.shared.exceptions import FileTooLargeError, InvalidImageError, StagingTokenNotFoundError

STAGING_SUBDIR = "staging"
MAX_DIMENSION = 1600
THUMB_DIMENSION = 400
JPEG_QUALITY = 85

_FORMAT_TO_EXT = {"JPEG": "jpg", "PNG": "png"}


@dataclass
class ProcessedImage:
    bytes_: bytes
    thumbnail_bytes: bytes
    ext: str
    mime_type: str


def _upload_root() -> Path:
    return Path(settings.upload_dir)


def _staging_root() -> Path:
    path = _upload_root() / STAGING_SUBDIR
    path.mkdir(parents=True, exist_ok=True)
    return path


def _url_for(path: Path) -> str:
    """Builds a URL relative to the mounted /uploads static route — always relative
    to _upload_root(), regardless of whether upload_dir itself is a relative path
    (production) or an absolute one (tests, via a monkeypatched tmp_path)."""
    relative = path.relative_to(_upload_root())
    return "/uploads/" + relative.as_posix()


def _path_for_url(photo_url: str) -> Path:
    relative = photo_url.removeprefix("/uploads/")
    return _upload_root() / relative


def _thumbnail_path(path: Path) -> Path:
    return path.with_name(f"{path.stem}_thumb{path.suffix}")


def validate_and_process_image(raw_bytes: bytes) -> ProcessedImage:
    """Re-encodes the upload: verifies it's really an image (not spoofed content-type),
    auto-orients it, strips EXIF (may carry GPS location), caps its dimensions, and
    produces a matching thumbnail for the masonry grid."""
    if len(raw_bytes) > settings.max_upload_size_bytes:
        raise FileTooLargeError()

    try:
        Image.open(io.BytesIO(raw_bytes)).verify()
    except Exception as exc:
        raise InvalidImageError() from exc

    try:
        image = Image.open(io.BytesIO(raw_bytes))
        image.load()
    except Exception as exc:
        raise InvalidImageError() from exc

    if image.format not in _FORMAT_TO_EXT:
        raise InvalidImageError("Sadece JPEG veya PNG formatında görsel yükleyebilirsiniz")

    image = ImageOps.exif_transpose(image) or image

    has_alpha = image.mode in ("RGBA", "LA") or (image.mode == "P" and "transparency" in image.info)
    if has_alpha:
        image = image.convert("RGBA")
        save_format, ext, mime_type = "PNG", "png", "image/png"
    else:
        image = image.convert("RGB")
        save_format, ext, mime_type = "JPEG", "jpg", "image/jpeg"

    if max(image.size) > MAX_DIMENSION:
        image.thumbnail((MAX_DIMENSION, MAX_DIMENSION), Image.LANCZOS)

    main_buffer = io.BytesIO()
    save_kwargs = {"quality": JPEG_QUALITY, "optimize": True} if save_format == "JPEG" else {"optimize": True}
    image.save(main_buffer, format=save_format, **save_kwargs)

    thumb_image = image.copy()
    thumb_image.thumbnail((THUMB_DIMENSION, THUMB_DIMENSION), Image.LANCZOS)
    thumb_buffer = io.BytesIO()
    thumb_image.save(thumb_buffer, format=save_format, **save_kwargs)

    return ProcessedImage(
        bytes_=main_buffer.getvalue(),
        thumbnail_bytes=thumb_buffer.getvalue(),
        ext=ext,
        mime_type=mime_type,
    )


def save_staged(processed: ProcessedImage) -> tuple[str, str, str]:
    """Writes the processed image + thumbnail into uploads/staging/. Returns
    (staging_token, photo_url, thumbnail_url) — nothing here touches the DB or the
    permanent uploads/ location, so an abandoned upload leaves no DB row behind."""
    token = uuid.uuid4().hex
    staging_dir = _staging_root()

    main_path = staging_dir / f"{token}.{processed.ext}"
    thumb_path = _thumbnail_path(main_path)

    main_path.write_bytes(processed.bytes_)
    thumb_path.write_bytes(processed.thumbnail_bytes)

    return token, _url_for(main_path), _url_for(thumb_path)


def _find_staged_file(staging_token: str) -> Path | None:
    staging_dir = _staging_root()
    for ext in _FORMAT_TO_EXT.values():
        candidate = staging_dir / f"{staging_token}.{ext}"
        if candidate.exists():
            return candidate
    return None


def promote_staged_to_permanent(staging_token: str) -> str:
    """Moves a confirmed upload out of staging/ into the permanent uploads/ dir and
    returns its photo_url. Raises if the staging file is missing or already expired."""
    staged_main = _find_staged_file(staging_token)
    if staged_main is None:
        raise StagingTokenNotFoundError()

    staged_thumb = _thumbnail_path(staged_main)
    permanent_main = _upload_root() / staged_main.name
    permanent_thumb = _thumbnail_path(permanent_main)

    staged_main.replace(permanent_main)
    if staged_thumb.exists():
        staged_thumb.replace(permanent_thumb)

    return _url_for(permanent_main)


def delete_permanent_files(photo_url: str) -> None:
    """Best-effort delete of the full-size + thumbnail files for a given photo_url.
    Never raises — a missing file shouldn't block deleting the DB row."""
    main_path = _path_for_url(photo_url)
    thumb_path = _thumbnail_path(main_path)
    for path in (main_path, thumb_path):
        try:
            path.unlink(missing_ok=True)
        except OSError:
            pass


def cleanup_stale_staging_files(max_age_hours: int | None = None) -> None:
    """Deletes anything left in uploads/staging/ older than max_age_hours — the
    self-cleaning half of the analyze-and-stage flow (an abandoned upload that's
    never confirmed via POST /wardrobe/items would otherwise sit there forever)."""
    max_age_hours = max_age_hours if max_age_hours is not None else settings.staging_max_age_hours
    cutoff = time.time() - (max_age_hours * 3600)
    staging_dir = _staging_root()

    for entry in staging_dir.iterdir():
        try:
            if entry.is_file() and entry.stat().st_mtime < cutoff:
                entry.unlink(missing_ok=True)
        except OSError:
            continue
