from sqlalchemy import select, update, delete, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models import JobSeekerProfile, CompanyProfile, ResumeItem
from app.schemas.profile import JobSeekerUpdate, CompanyUpdate


class ProfileRepository:

    # --- Job Seeker Methods ---
    @staticmethod
    async def get_seeker_by_user_id(session: AsyncSession, user_id: int):
        query = select(JobSeekerProfile).where(JobSeekerProfile.user_id == user_id)
        result = await session.execute(query)
        return result.scalars().first()


    @staticmethod
    async def upsert_seeker(session: AsyncSession, user_id: int, data: JobSeekerUpdate):
        # Пытаемся найти существующий профиль
        profile = await ProfileRepository.get_seeker_by_user_id(session, user_id)

        if profile:
            # Если есть - обновляем поля
            for key, value in data.model_dump().items():
                setattr(profile, key, value)
        else:
            # Если нет - создаем новый
            profile = JobSeekerProfile(user_id=user_id, **data.model_dump())
            session.add(profile)

        await session.commit()
        await session.refresh(profile)
        return profile


    # --- Company Methods ---
    @staticmethod
    async def get_company_by_user_id(session: AsyncSession, user_id: int):
        query = select(CompanyProfile).where(CompanyProfile.user_id == user_id)
        result = await session.execute(query)
        return result.scalars().first()


    @staticmethod
    async def upsert_company(session: AsyncSession, user_id: int, data: CompanyUpdate):
        profile = await ProfileRepository.get_company_by_user_id(session, user_id)

        if profile:
            for key, value in data.model_dump().items():
                setattr(profile, key, value)
        else:
            profile = CompanyProfile(user_id=user_id, **data.model_dump())
            session.add(profile)

        await session.commit()
        await session.refresh(profile)
        return profile


    @staticmethod
    async def delete_profiles_by_user_id(session: AsyncSession, user_id: int):
        await session.execute(delete(JobSeekerProfile).where(JobSeekerProfile.user_id == user_id))
        await session.execute(delete(CompanyProfile).where(CompanyProfile.user_id == user_id))

        await session.commit()

    @staticmethod
    async def count_resumes(session: AsyncSession, user_id: int) -> int:
        query = select(func.count(ResumeItem.id)).where(ResumeItem.user_id == user_id)
        result = await session.execute(query)
        return result.scalar()

    @staticmethod
    async def add_resume(session: AsyncSession, user_id: int, file_url: str, file_name: str):
        new_resume = ResumeItem(user_id=user_id, file_url=file_url, file_name=file_name)
        session.add(new_resume)
        await session.commit()
        return new_resume