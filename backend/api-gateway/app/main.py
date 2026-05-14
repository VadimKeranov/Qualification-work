# api-gateway/app/main.py
from fastapi import FastAPI
from prometheus_fastapi_instrumentator import Instrumentator
from fastapi.middleware.cors import CORSMiddleware
from app.routes.auth import router as auth_router
from app.routes.profiles import router as profiles_router
from app.routes.vacancies import router as vacancies_router
from app.routes.applications import router as applications_router


def create_app() -> FastAPI:
    app = FastAPI(
        title="API Gateway",
        version="1.0.0"
    )

    # Настройка CORS (чтобы фронт мог стучаться в Gateway)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(auth_router, prefix="/auth", tags=["Auth"])
    app.include_router(profiles_router, prefix="/profiles", tags=["Profiles"])
    app.include_router(vacancies_router, prefix="/vacancies", tags=["Vacancies"])
    app.include_router(applications_router, prefix="/applications", tags=["Applications"]) # <--- 2. Подключаем роутер

    return app


app = create_app()

Instrumentator().instrument(app).expose(app)