from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.core.dependencies import get_db
from app.vacancies.schemas import VacancyCreate, VacancyResponse
from app.vacancies.service import VacancyService
from app.utils.security import get_current_user_payload

router = APIRouter(prefix="/vacancies", tags=["Vacancies"])


@router.get("/{vacancy_id}", response_model=VacancyResponse)
async def get_vacancy(vacancy_id: int, db: AsyncSession = Depends(get_db)):
    return await VacancyService.get_vacancy(db, vacancy_id)


@router.get("/", response_model=List[VacancyResponse])
async def get_all_vacancies(db: AsyncSession = Depends(get_db)):
    return await VacancyService.get_all_vacancies(db)


@router.post("/", response_model=VacancyResponse)
async def create_vacancy(
        vacancy_data: VacancyCreate,
        db: AsyncSession = Depends(get_db),
        payload: dict = Depends(get_current_user_payload)
):
    owner_id = payload.get("id")
    if not owner_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")

    return await VacancyService.create_vacancy(db, vacancy_data, owner_id)


@router.get("/by-company/{company_id}", response_model=List[VacancyResponse])
async def get_vacancies_by_company(company_id: int, db: AsyncSession = Depends(get_db)):
    return await VacancyService.get_vacancies_by_company(db, company_id)