import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.core.dependencies import get_db
from app.vacancies.schemas import VacancyCreate, VacancyResponse
from app.vacancies.service import VacancyService
from app.utils.security import get_current_user_payload

router = APIRouter(prefix="/vacancies", tags=["Vacancies"])
logger = logging.getLogger(__name__)


@router.get("/{vacancy_id}", response_model=VacancyResponse)
async def get_vacancy(vacancy_id: int, db: AsyncSession = Depends(get_db)):
    logger.info(f"API Request: get_vacancy (ID: {vacancy_id})")
    return await VacancyService.get_vacancy(db, vacancy_id)


@router.get("/", response_model=List[VacancyResponse])
async def get_all_vacancies(db: AsyncSession = Depends(get_db)):
    logger.info("API Request: get_all_vacancies")
    return await VacancyService.get_all_vacancies(db)


@router.post("/", response_model=VacancyResponse)
async def create_vacancy(
        vacancy_data: VacancyCreate,
        db: AsyncSession = Depends(get_db),
        payload: dict = Depends(get_current_user_payload)
):
    owner_id = payload.get("id")
    if not owner_id:
        logger.error("HTTP 401: Unauthorized attempt to create a vacancy. User ID missing.")
        raise HTTPException(status_code=401, detail="User ID not found in token")

    logger.info(f"API Request: User ID {owner_id} is creating a new vacancy '{vacancy_data.title}'")
    return await VacancyService.create_vacancy(db, vacancy_data, owner_id)