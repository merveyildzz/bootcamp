from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.features.chat import service
from app.features.chat.schemas import ChatMessagePublic, ConversationPublic, SendMessageRequest
from app.models.user import User
from app.shared.exceptions import AppError

router = APIRouter(prefix="/chat", tags=["chat"], dependencies=[Depends(get_current_user)])


@router.get("/conversations", response_model=list[ConversationPublic])
def list_conversations(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return service.list_conversations(db, current_user.id)


@router.post("/conversations", response_model=ConversationPublic, status_code=status.HTTP_201_CREATED)
def create_conversation(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return service.create_conversation(db, current_user)


@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_conversation(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        service.delete_conversation(db, current_user.id, conversation_id)
    except AppError as exc:
        raise exc.to_http_exception()


@router.get("/conversations/{conversation_id}/messages", response_model=list[ChatMessagePublic])
def list_messages(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.list_messages(db, current_user.id, conversation_id)
    except AppError as exc:
        raise exc.to_http_exception()


@router.post("/conversations/{conversation_id}/messages", response_model=ChatMessagePublic)
def send_message(
    conversation_id: int,
    payload: SendMessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.send_message(db, current_user, conversation_id, payload)
    except AppError as exc:
        raise exc.to_http_exception()
