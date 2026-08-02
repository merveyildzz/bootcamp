from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.features.auth.router import router as auth_router
from app.features.chat.router import router as chat_router
from app.features.events.router import router as events_router
from app.features.outfits.router import router as outfits_router
from app.features.stats.router import router as stats_router
from app.features.wardrobe.image_utils import cleanup_stale_staging_files
from app.features.wardrobe.router import router as wardrobe_router
from app.features.weather.router import router as weather_router


@asynccontextmanager
async def lifespan(_: FastAPI):
    cleanup_stale_staging_files()
    yield


app = FastAPI(title="Style Mind API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

upload_dir = Path(settings.upload_dir)
upload_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=upload_dir), name="uploads")

app.include_router(auth_router)
app.include_router(wardrobe_router)
app.include_router(weather_router)
app.include_router(chat_router)
app.include_router(events_router)
app.include_router(outfits_router)
app.include_router(stats_router)


@app.get("/health")
def health():
    return {"status": "ok"}
