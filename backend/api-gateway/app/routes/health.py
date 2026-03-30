from fastapi import APIRouter
from app.services.health_service import HealthService

router = APIRouter()

@router.get("/")
async def health_check():
    return await HealthService.check()