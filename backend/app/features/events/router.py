from fastapi import APIRouter, Depends

from app.core.deps import get_current_user

router = APIRouter(prefix="/events", tags=["events"], dependencies=[Depends(get_current_user)])

# TODO (Faz 5): etkinlik CRUD (iş görüşmesi, düğün, toplantı, kahve, tatil, vb.).
