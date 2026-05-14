import asyncio
import os
from prometheus_fastapi_instrumentator import Instrumentator
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.profiles.routes import router as profiles_router
from app.core.messaging import EventConsumer
from app.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    consumer_task = asyncio.create_task(EventConsumer.start_consuming())

    yield

    consumer_task.cancel()


app = FastAPI(title="Profile Service", lifespan=lifespan)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["Authorization", "Content-Type"],
)

os.makedirs(os.path.join(UPLOADS_DIR, "avatars"), exist_ok=True)
os.makedirs(os.path.join(UPLOADS_DIR, "logos"), exist_ok=True)
os.makedirs(os.path.join(UPLOADS_DIR, "resumes"), exist_ok=True)


app.mount("/profiles/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

app.include_router(profiles_router, prefix="/profiles")
Instrumentator().instrument(app).expose(app)