from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models import Vacancy
from app.vacancies.schemas import VacancyCreate

class VacancyRepository:

    @staticmethod
    async def get_all(session: AsyncSession):
        query = select(Vacancy).where(Vacancy.is_active == True).order_by(Vacancy.created_at.desc())
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
            location=data.location,
            salary_from=data.salary_from,
            salary_to=data.salary_to,
            company_id=data.company_id,
            company_name=data.company_name,
            company_logo=data.company_logo,
            owner_id=owner_id,
            is_active=True,
            hiring_funnel=data.hiring_funnel
        )
        session.add(new_vacancy)
        await session.commit()
        await session.refresh(new_vacancy)
        return new_vacancy

    @staticmethod
    async def get_by_company(session: AsyncSession, company_id: int):
        query = select(Vacancy).where(
            Vacancy.owner_id == company_id,
            Vacancy.is_active == True
        ).order_by(Vacancy.created_at.desc())
        result = await session.execute(query)
        return result.scalars().all()

    @staticmethod
    async def sync_company_data(session: AsyncSession, company_id: int, name: str, logo: str | None):
        query = (
            update(Vacancy)
            .where(Vacancy.owner_id == company_id)
            .values(company_name=name, company_logo=logo)
        )
        await session.execute(query)
        await session.commit()

    @staticmethod
    async def increment_applications_count(session: AsyncSession, vacancy_id: int):
        """Увеличивает счетчик откликов на 1 для указанной вакансии."""
        query = (
            update(Vacancy)
            .where(Vacancy.id == vacancy_id)
            .values(applications_count=Vacancy.applications_count + 1)
        )
        await session.execute(query)
        await session.commit()
