import logging
import time
from fastapi import FastAPI, Request
from prometheus_fastapi_instrumentator import Instrumentator
from fastapi.middleware.cors import CORSMiddleware
from app.routes.auth import router as auth_router
from app.routes.profiles import router as profiles_router
from app.routes.vacancies import router as vacancies_router
from app.routes.applications import router as applications_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("api-gateway")


def create_app() -> FastAPI:
    app = FastAPI(title="API Gateway", version="1.0.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.middleware("http")
    async def log_requests(request: Request, call_next):
        start_time = time.time()
        logger.info(f"Incoming request: {request.method} {request.url.path}")

        response = await call_next(request)

        process_time = (time.time() - start_time) * 1000

        logger.info(
            f"Completed request: {request.method} {request.url.path} "
            f"Status: {response.status_code} "
            f"Time: {process_time:.2f}ms"
        )
        return response

    app.include_router(auth_router, prefix="/auth", tags=["Auth"])
    app.include_router(profiles_router, prefix="/profiles", tags=["Profiles"])
    app.include_router(vacancies_router, prefix="/vacancies", tags=["Vacancies"])
    app.include_router(applications_router, prefix="/applications", tags=["Applications"])

    return app

app = create_app()
Instrumentator().instrument(app).expose(app)