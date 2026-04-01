# api-gateway/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.auth import router as auth_router  # <--- Импорт нового роутера
from app.routes.profiles import router as profiles_router
from app.routes.vacancies import router as vacancies_router

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
    return app


app = create_app()