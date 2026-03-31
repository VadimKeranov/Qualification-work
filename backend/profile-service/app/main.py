import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.profiles.routes import router as profiles_router
from app.core.messaging import EventConsumer
from app.db.session import engine
from app.db.models import Base

@asynccontextmanager
async def lifespan(app: FastAPI):
    # При старте: создаем таблицы и запускаем потребителя в фоне
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    consumer_task = asyncio.create_task(EventConsumer.start_consuming())
    
    yield
    
    # При остановке: отменяем задачу потребителя
    consumer_task.cancel()


app = FastAPI(title="Profile Service", lifespan=lifespan)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Статика для фото и резюме
app.mount("/profiles/uploads", StaticFiles(directory="uploads"), name="uploads")

# Подключаем роутер
app.include_router(profiles_router)
