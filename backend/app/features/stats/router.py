from fastapi import APIRouter, Depends

from app.core.deps import get_current_user

router = APIRouter(prefix="/stats", tags=["stats"], dependencies=[Depends(get_current_user)])

# TODO (Faz 7): en çok kullanılan renk/kıyafet, aylık kombin sayısı, dolap kullanım oranı, akıllı öneriler.
