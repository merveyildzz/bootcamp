from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    hash_token,
    verify_password,
)
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.shared.exceptions import (
    EmailAlreadyRegisteredError,
    InvalidCredentialsError,
    InvalidRefreshTokenError,
)


def create_user(db: Session, email: str, password: str, full_name: str) -> User:
    email = email.lower()
    existing = db.scalar(select(User).where(User.email == email))
    if existing is not None:
        raise EmailAlreadyRegisteredError()

    user = User(email=email, hashed_password=hash_password(password), full_name=full_name)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str) -> User:
    user = db.scalar(select(User).where(User.email == email.lower()))
    if user is None or not verify_password(password, user.hashed_password):
        raise InvalidCredentialsError()
    return user


def issue_token_pair(db: Session, user: User) -> tuple[str, str]:
    """Returns (access_token, raw_refresh_token). The raw refresh token is only ever
    returned here to be set as an httpOnly cookie by the router — never persisted as-is."""
    access_token = create_access_token(user.id)
    refresh_token, jti, expires_at = create_refresh_token(user.id)

    db.add(
        RefreshToken(
            user_id=user.id,
            token_hash=hash_token(refresh_token),
            jti=jti,
            expires_at=expires_at,
        )
    )
    db.commit()

    return access_token, refresh_token


def rotate_refresh_token(db: Session, raw_refresh_token: str, payload: dict) -> tuple[str, str, User]:
    """Validates the presented refresh token against the stored hash, revokes it, and
    issues a fresh pair. Returns (access_token, new_refresh_token, user)."""
    token_hash = hash_token(raw_refresh_token)
    stored = db.scalar(select(RefreshToken).where(RefreshToken.token_hash == token_hash))

    if stored is None or stored.revoked_at is not None:
        raise InvalidRefreshTokenError()
    if stored.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise InvalidRefreshTokenError()

    user = db.get(User, int(payload["sub"]))
    if user is None or user.id != stored.user_id:
        raise InvalidRefreshTokenError()

    stored.revoked_at = datetime.now(timezone.utc)
    db.commit()

    access_token, new_refresh_token = issue_token_pair(db, user)
    return access_token, new_refresh_token, user


def revoke_refresh_token(db: Session, raw_refresh_token: str) -> None:
    token_hash = hash_token(raw_refresh_token)
    stored = db.scalar(select(RefreshToken).where(RefreshToken.token_hash == token_hash))
    if stored is not None and stored.revoked_at is None:
        stored.revoked_at = datetime.now(timezone.utc)
        db.commit()
