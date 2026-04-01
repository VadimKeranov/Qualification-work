import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.profiles.routes import router as profiles_router
from app.core.messaging import EventConsumer
from app.db.session import engine
from app.db.models import Base
from app.config import settings # <--- Импортируем settings

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    consumer_task = asyncio.create_task(EventConsumer.start_consuming())
    
    yield
    
    consumer_task.cancel()


app = FastAPI(title="Profile Service", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS.split(","), # <--- Используем settings
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["Authorization", "Content-Type"],
)

app.mount("/profiles/uploads", StaticFiles(directory="uploads"), name="uploads")


app.include_router(profiles_router, prefix="/profiles")
