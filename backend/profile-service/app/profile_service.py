from sqlalchemy.ext.asyncio import AsyncSession
from app.profile_repository import ProfileRepository
from app.schemas.profile import JobSeekerUpdate, CompanyUpdate

class ProfileService:
    @staticmethod
    async def get_my_seeker_profile(session: AsyncSession, user_id: int):
        return await ProfileRepository.get_seeker_by_user_id(session, user_id)

    @staticmethod
    async def update_my_seeker_profile(session: AsyncSession, user_id: int, data: JobSeekerUpdate):
        return await ProfileRepository.upsert_seeker(session, user_id, data)

    @staticmethod
    async def get_my_company_profile(session: AsyncSession, user_id: int):
        return await ProfileRepository.get_company_by_user_id(session, user_id)

    @staticmethod
    async def update_my_company_profile(session: AsyncSession, user_id: int, data: CompanyUpdate):
        return await ProfileRepository.upsert_company(session, user_id, data)