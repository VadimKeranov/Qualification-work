from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models import Vacancy
from app.vacancies.schemas import VacancyCreate

class VacancyRepository:

    @staticmethod
    async def get_all(session: AsyncSession):
        query = select(Vacancy).where(Vacancy.is_active == True)
        result = await session.execute(query)
        return result.scalars().all()

    @staticmethod
    async def get_by_id(session: AsyncSession, vacancy_id: int) -> Vacancy | None:
        query = select(Vacancy).where(Vacancy.id == vacancy_id)
        result = await session.execute(query)
        return result.scalars().first()

    @staticmethod
    async def create(session: AsyncSession, data: VacancyCreate, owner_id: int) -> Vacancy:
        new_vacancy = Vacancy(
            title=data.title,
            description=data.description,
            requirements=data.requirements,
            salary_from=data.salary_from,
            salary_to=data.salary_to,
            company_id=data.company_id,
            owner_id=owner_id,
            is_active=True
        )
        session.add(new_vacancy)
        await session.commit()
        await session.refresh(new_vacancy)
        return new_vacancy

    @staticmethod
    async def get_by_company(session: AsyncSession, company_id: int):
        query = select(Vacancy).where(
            Vacancy.company_id == company_id,
            Vacancy.is_active == True
        )
        result = await session.execute(query)
        return result.scalars().all()