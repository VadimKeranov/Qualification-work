import logging
from sqlalchemy import select, update
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.vacancies.repository import VacancyRepository
from app.vacancies.schemas import VacancyCreate
from app.db.models import Vacancy

# Ініціалізація логера
logger = logging.getLogger(__name__)

class VacancyService:
    @staticmethod
    async def get_all_vacancies(session: AsyncSession):
        logger.info("Fetching all active vacancies from database.")
        return await VacancyRepository.get_all(session)

    @staticmethod
    async def get_vacancy(session: AsyncSession, vacancy_id: int):
        logger.info(f"Fetching details for vacancy ID: {vacancy_id}")
        vacancy = await VacancyRepository.get_by_id(session, vacancy_id)
        if not vacancy:
            logger.warning(f"Vacancy ID {vacancy_id} not found.")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Vacancy not found"
            )
        return vacancy

    @staticmethod
    async def create_vacancy(session: AsyncSession, data: VacancyCreate, owner_id: int):
        logger.info(f"Attempting to create vacancy '{data.title}' for owner ID: {owner_id}")
        vacancy = await VacancyRepository.create(session, data, owner_id)
        logger.info(f"Vacancy '{vacancy.title}' successfully created with ID: {vacancy.id}")
        return vacancy

    @staticmethod
    async def get_vacancies_by_company(session: AsyncSession, company_id: int):
        logger.info(f"Fetching vacancies for company ID: {company_id}")
        return await VacancyRepository.get_by_company(session, company_id)

    @staticmethod
    async def sync_company_data(session: AsyncSession, company_id: int, name: str, logo: str | None):
        logger.info(f"Syncing company data (Name, Logo) for company ID {company_id} in vacancies.")
        query = (
            update(Vacancy)
            .where(Vacancy.owner_id == company_id)
            .values(company_name=name, company_logo=logo)
        )
        await session.execute(query)
        await session.commit()
        logger.info(f"Company data synced successfully for company ID {company_id}.")