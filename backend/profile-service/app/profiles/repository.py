from sqlalchemy import select, delete, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.db.models import JobSeekerProfile, CompanyProfile, ResumeItem, Application
from app.profiles.schemas import JobSeekerUpdate, CompanyUpdate
from datetime import datetime

class ProfileRepository:

    # --- Application Methods ---
    @staticmethod
    async def add_application(session: AsyncSession, app_id: int, user_id: int, vacancy_id: int, status: str, created_at: datetime, vacancy_title: str, company_name: str):
        new_app = Application(
            id=app_id, user_id=user_id, vacancy_id=vacancy_id,
            status=status, created_at=created_at,
            vacancy_title=vacancy_title, company_name=company_name
        )
        session.add(new_app)
        await session.commit()
        return new_app

    # --- Job Seeker Methods ---
    @staticmethod
    async def get_seeker_by_user_id(session: AsyncSession, user_id: int):
        query = select(JobSeekerProfile).options(
            selectinload(JobSeekerProfile.resumes),
            selectinload(JobSeekerProfile.applications)
        ).where(JobSeekerProfile.user_id == user_id)
        result = await session.execute(query)
        return result.scalars().first()

    @staticmethod
    async def get_all_seekers(session: AsyncSession):
        query = select(JobSeekerProfile).options(
            selectinload(JobSeekerProfile.resumes),
            selectinload(JobSeekerProfile.applications)
        )
        result = await session.execute(query)
        return result.scalars().all()

    @staticmethod
    async def upsert_seeker(session: AsyncSession, user_id: int, data: JobSeekerUpdate):
        profile = await ProfileRepository.get_seeker_by_user_id(session, user_id)
        if profile:
            for key, value in data.model_dump(exclude_unset=True).items():
                setattr(profile, key, value)
        else:
            profile = JobSeekerProfile(user_id=user_id, **data.model_dump())
            session.add(profile)
        await session.commit()
        await session.refresh(profile)
        return profile

    @staticmethod
    async def update_photo_url(session: AsyncSession, user_id: int, photo_url: str):
        profile = await ProfileRepository.get_seeker_by_user_id(session, user_id)
        if profile:
            profile.photo_url = photo_url
            await session.commit()
            await session.refresh(profile)
        return profile

    @staticmethod
    async def add_resume(session: AsyncSession, user_id: int, file_url: str, file_name: str):
        new_resume = ResumeItem(user_id=user_id, file_url=file_url, file_name=file_name)
        session.add(new_resume)
        await session.commit()
        return new_resume

    @staticmethod
    async def delete_resume(session: AsyncSession, resume_id: int, user_id: int):
        query = select(ResumeItem).where(ResumeItem.id == resume_id, ResumeItem.user_id == user_id)
        result = await session.execute(query)
        resume = result.scalars().first()
        if resume:
            await session.delete(resume)
            await session.commit()
            return True
        return False

    # --- Company Methods ---
    @staticmethod
    async def get_company_by_user_id(session: AsyncSession, user_id: int):
        query = select(CompanyProfile).where(CompanyProfile.user_id == user_id)
        result = await session.execute(query)
        return result.scalars().first()

    @staticmethod
    async def get_company_by_id(session: AsyncSession, company_id: int):
        query = select(CompanyProfile).where(CompanyProfile.id == company_id)
        result = await session.execute(query)
        return result.scalars().first()

    @staticmethod
    async def upsert_company(session: AsyncSession, user_id: int, data: CompanyUpdate):
        profile = await ProfileRepository.get_company_by_user_id(session, user_id)
        if profile:
            for key, value in data.model_dump(exclude_unset=True).items():
                setattr(profile, key, value)
        else:
            profile = CompanyProfile(user_id=user_id, **data.model_dump())
            session.add(profile)
        await session.commit()
        await session.refresh(profile)
        return profile

    @staticmethod
    async def update_logo_url(session: AsyncSession, user_id: int, logo_url: str):
        profile = await ProfileRepository.get_company_by_user_id(session, user_id)
        if profile:
            profile.logo_url = logo_url
            await session.commit()
            await session.refresh(profile)
        return profile

    # --- Admin/Global Methods ---
    @staticmethod
    async def delete_profiles_by_user_id(session: AsyncSession, user_id: int):
        await session.execute(delete(JobSeekerProfile).where(JobSeekerProfile.user_id == user_id))
        await session.execute(delete(CompanyProfile).where(CompanyProfile.user_id == user_id))
        await session.commit()