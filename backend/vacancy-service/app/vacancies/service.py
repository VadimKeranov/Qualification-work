from sqlalchemy import select, update
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.vacancies.repository import VacancyRepository
from app.vacancies.schemas import VacancyCreate
from app.db.models import Vacancy

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

    @staticmethod
    async def sync_company_data(session: AsyncSession, company_id: int, name: str, logo: str | None):
        query = (
            update(Vacancy)
            .where(Vacancy.owner_id == company_id)
            .values(company_name=name, company_logo=logo)
        )
        await session.execute(query)
        await session.commit()