from fastapi import FastAPI
from app.vacancy_routes import router as vacancy_router

app = FastAPI(title="Vacancy Service")

app.include_router(vacancy_router)