from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.vacancies.routes import router as vacancies_router
from app.db.database import engine
from app.db.models import Base
from app.config import settings # <--- Импортируем settings

@asynccontextmanager
async def lifespan(app: FastAPI):
    # При старте: создаем таблицы
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield

app = FastAPI(title="Vacancy Service", lifespan=lifespan)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS.split(","), # <--- Используем settings
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["Authorization", "Content-Type"],
)

# Подключаем роутер
app.include_router(vacancies_router)
