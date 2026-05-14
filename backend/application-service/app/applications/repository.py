from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models import Application
from app.applications.schemas import ApplicationCreate

class ApplicationRepository:

    @staticmethod
    async def create(session: AsyncSession, seeker_id: int, data: ApplicationCreate) -> Application:
        new_app = Application(
            vacancy_id=data.vacancy_id,
            seeker_id=seeker_id,
            resume_url=data.resume_url,
            cover_letter=data.cover_letter,
            status="pending"
        )
        session.add(new_app)
        await session.commit()
        await session.refresh(new_app)
        return new_app

    @staticmethod
    async def get_by_seeker(session: AsyncSession, seeker_id: int):
        query = select(Application).where(Application.seeker_id == seeker_id).order_by(Application.created_at.desc())
        result = await session.execute(query)
        return result.scalars().all()

    @staticmethod
    async def get_by_vacancy(session: AsyncSession, vacancy_id: int):
        query = select(Application).where(Application.vacancy_id == vacancy_id).order_by(Application.created_at.desc())
        result = await session.execute(query)
        return result.scalars().all()

    @staticmethod
    async def get_by_vacancy_ids(session: AsyncSession, vacancy_ids: list[int]):
        query = select(Application).where(Application.vacancy_id.in_(vacancy_ids)).order_by(Application.created_at.desc())
        result = await session.execute(query)
        return result.scalars().all()

    @staticmethod
    async def get_by_id(session: AsyncSession, application_id: int) -> Application | None:
        query = select(Application).where(Application.id == application_id)
        result = await session.execute(query)
        return result.scalars().first()

    @staticmethod
    async def check_existing(session: AsyncSession, seeker_id: int, vacancy_id: int) -> Application | None:
        query = select(Application).where(
            and_(
                Application.seeker_id == seeker_id,
                Application.vacancy_id == vacancy_id
            )
        )
        result = await session.execute(query)
        return result.scalars().first()

    @staticmethod
    async def update_status(session: AsyncSession, application: Application, new_status: str,
                            employer_message: str = None) -> Application:
        application.status = new_status
        if employer_message is not None:
            application.employer_message = employer_message  # Зберігаємо лист
        await session.commit()
        await session.refresh(application)
        return application