import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from prometheus_fastapi_instrumentator import Instrumentator
from app.auth.routes import router as auth_router
from app.admin.routes import router as admin_router
from app.db.session import engine, AsyncSessionLocal
from app.db.models import Base, User
from app.config import settings
from app.auth.repository import UserRepository


# --- Фонова задача для очищення БД ---
async def cleanup_unverified_users_loop():
    while True:
        try:
            # Засинаємо на 30 хвилин (30 хвилин * 60 секунд)
            await asyncio.sleep(30 * 60)

            # Відкриваємо сесію та викликаємо метод видалення
            async with AsyncSessionLocal() as session:
                await UserRepository.delete_unverified_expired_users(session, expire_minutes=30)
                print("[CleanUp] Видалено прострочені непідтверджені акаунти")

        except asyncio.CancelledError:
            # Якщо сервер вимикається, коректно завершуємо цикл
            break
        except Exception as e:
            print(f"[CleanUp Error] {e}")
            await asyncio.sleep(60)  # Зачекати хвилину у разі помилки перед повтором


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Створюємо таблиці при запуску
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # 2. Запускаємо фонову задачу
    cleanup_task = asyncio.create_task(cleanup_unverified_users_loop())

    yield  # Тут працює сам сервер

    # 3. Коректно зупиняємо фонову задачу при вимкненні сервера
    cleanup_task.cancel()
    try:
        await cleanup_task
    except asyncio.CancelledError:
        pass


app = FastAPI(title="Auth Service", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS.split(','),  # Беремо з конфігу
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(admin_router, prefix="/auth")
Instrumentator().instrument(app).expose(app)