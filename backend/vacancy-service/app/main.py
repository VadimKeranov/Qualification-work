import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator
from app.vacancies.routes import router as vacancies_router
from app.db.database import engine
from app.db.models import Base
from app.config import settings
from app.core.messaging import EventConsumer

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Створюємо таблиці в БД
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Запускаємо прослуховування RabbitMQ
    consumer_task = asyncio.create_task(EventConsumer.start_consuming())

    yield

    # Зупиняємо прослуховування при вимкненні сервера
    consumer_task.cancel()

app = FastAPI(title="Vacancy Service", lifespan=lifespan)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["Authorization", "Content-Type"],
)

# Підключаємо роутер
app.include_router(vacancies_router)
Instrumentator().instrument(app).expose(app)