import jwt
from fastapi import APIRouter, Cookie, Depends, Response, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.security import decode_token
from app.features.auth import service
from app.features.auth.schemas import (
    AccessTokenResponse,
    ChangeEmailRequest,
    ChangePasswordRequest,
    LoginRequest,
    RegisterRequest,
    UpdateProfileRequest,
    UserPublic,
)
from app.models.user import User
from app.shared.exceptions import AppError, InvalidRefreshTokenError

router = APIRouter(prefix="/auth", tags=["auth"])

REFRESH_COOKIE_NAME = "refresh_token"
REFRESH_COOKIE_PATH = "/auth"


def _set_refresh_cookie(response: Response, refresh_token: str) -> None:
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="lax",
        path=REFRESH_COOKIE_PATH,
        max_age=settings.refresh_token_expire_days * 24 * 60 * 60,
    )


@router.post("/register", response_model=AccessTokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, response: Response, db: Session = Depends(get_db)):
    try:
        user = service.create_user(db, payload.email, payload.password, payload.full_name)
        access_token, refresh_token = service.issue_token_pair(db, user)
    except AppError as exc:
        raise exc.to_http_exception()

    _set_refresh_cookie(response, refresh_token)
    return AccessTokenResponse(access_token=access_token, user=UserPublic.model_validate(user))


@router.post("/login", response_model=AccessTokenResponse)
def login(payload: LoginRequest, response: Response, db: Session = Depends(get_db)):
    try:
        user = service.authenticate_user(db, payload.email, payload.password)
        access_token, refresh_token = service.issue_token_pair(db, user)
    except AppError as exc:
        raise exc.to_http_exception()

    _set_refresh_cookie(response, refresh_token)
    return AccessTokenResponse(access_token=access_token, user=UserPublic.model_validate(user))


@router.post("/refresh", response_model=AccessTokenResponse)
def refresh(
    response: Response,
    db: Session = Depends(get_db),
    refresh_token: str | None = Cookie(default=None, alias=REFRESH_COOKIE_NAME),
):
    if refresh_token is None:
        raise InvalidRefreshTokenError().to_http_exception()

    try:
        payload = decode_token(refresh_token)
    except jwt.PyJWTError:
        raise InvalidRefreshTokenError().to_http_exception()

    if payload.get("type") != "refresh":
        raise InvalidRefreshTokenError().to_http_exception()

    try:
        access_token, new_refresh_token, user = service.rotate_refresh_token(db, refresh_token, payload)
    except AppError as exc:
        raise exc.to_http_exception()

    _set_refresh_cookie(response, new_refresh_token)
    return AccessTokenResponse(access_token=access_token, user=UserPublic.model_validate(user))


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    response: Response,
    db: Session = Depends(get_db),
    refresh_token: str | None = Cookie(default=None, alias=REFRESH_COOKIE_NAME),
):
    if refresh_token is not None:
        service.revoke_refresh_token(db, refresh_token)
    response.delete_cookie(key=REFRESH_COOKIE_NAME, path=REFRESH_COOKIE_PATH)


@router.get("/me", response_model=UserPublic)
def me(current_user: User = Depends(get_current_user)):
    return UserPublic.model_validate(current_user)


@router.patch("/me", response_model=UserPublic)
def update_profile(
    payload: UpdateProfileRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user = service.update_profile(db, current_user, payload.full_name)
    return UserPublic.model_validate(user)


@router.post("/me/email", response_model=UserPublic)
def change_email(
    payload: ChangeEmailRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        user = service.change_email(db, current_user, payload.new_email)
    except AppError as exc:
        raise exc.to_http_exception()
    return UserPublic.model_validate(user)


@router.post("/me/password", status_code=status.HTTP_204_NO_CONTENT)
def change_password(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        service.change_password(db, current_user, payload.current_password, payload.new_password)
    except AppError as exc:
        raise exc.to_http_exception()
