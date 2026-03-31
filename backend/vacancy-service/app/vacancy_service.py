from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.vacancy_repository import VacancyRepository
from app.schemas.vacancy import VacancyCreate

class VacancyService:
    @staticmethod
    async def get_all_vacancies(session: AsyncSession):
        return await VacancyRepository.get_all(session)

    @staticmethod
    async def get_vacancy(session: AsyncSession, vacancy_id: int):
        vacancy = await VacancyRepository.get_by_id(session, vacancy_id)
        if not vacancy:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Vacancy not found"
            )
        return vacancy

    @staticmethod
    async def create_vacancy(session: AsyncSession, data: VacancyCreate, owner_id: int):
        return await VacancyRepository.create(session, data, owner_id)

    @staticmethod
    async def get_vacancies_by_company(session: AsyncSession, company_id: int):
        return await VacancyRepository.get_by_company(session, company_id)