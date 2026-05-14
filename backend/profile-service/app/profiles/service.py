import os
import uuid
import aiofiles
import logging
from datetime import datetime
from fastapi import UploadFile, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.profiles.repository import ProfileRepository
from app.profiles.schemas import JobSeekerUpdate, CompanyUpdate

UPLOAD_DIR = "uploads"
AVATAR_DIR = os.path.join(UPLOAD_DIR, "avatars")
LOGO_DIR = os.path.join(UPLOAD_DIR, "logos")
RESUME_DIR = os.path.join(UPLOAD_DIR, "resumes")

logger = logging.getLogger(__name__)

class ProfileService:
    @staticmethod
    async def get_my_seeker_profile(session: AsyncSession, user_id: int):
        return await ProfileRepository.get_seeker_by_user_id(session, user_id)

    @staticmethod
    async def get_all_seekers(session: AsyncSession):
        return await ProfileRepository.get_all_seekers(session)

    @staticmethod
    async def get_company_by_id(session: AsyncSession, company_id: int):
        return await ProfileRepository.get_company_by_id(session, company_id)

    @staticmethod
    async def get_my_company_profile(session: AsyncSession, user_id: int):
        return await ProfileRepository.get_company_by_user_id(session, user_id)

    @staticmethod
    async def update_my_seeker_profile(session: AsyncSession, user_id: int, data: JobSeekerUpdate):
        logger.info(f"Updating Seeker profile for user_id: {user_id}")
        return await ProfileRepository.upsert_seeker(session, user_id, data)

    @staticmethod
    async def update_my_company_profile(session: AsyncSession, user_id: int, data: CompanyUpdate):
        logger.info(f"Updating Company profile for user_id: {user_id}")
        return await ProfileRepository.upsert_company(session, user_id, data)

    @staticmethod
    async def upload_seeker_avatar(session: AsyncSession, user_id: int, file: UploadFile):
        logger.info(f"Starting avatar upload for seeker user_id: {user_id}")
        if not await ProfileRepository.get_seeker_by_user_id(session, user_id):
            logger.warning(f"Avatar upload failed: Profile not found for user_id {user_id}")
            raise HTTPException(status_code=404, detail="Профиль соискателя не найден")

        file_ext = file.filename.split('.')[-1]
        new_file_name = f"{uuid.uuid4()}.{file_ext}"
        file_path = os.path.join(AVATAR_DIR, new_file_name)

        async with aiofiles.open(file_path, "wb") as buffer:
            await buffer.write(await file.read())

        photo_url = f"/profiles/uploads/avatars/{new_file_name}"
        await ProfileRepository.update_photo_url(session, user_id, photo_url)
        logger.info(f"Avatar successfully saved for user_id {user_id}: {photo_url}")
        return {"photo_url": photo_url}

    @staticmethod
    async def upload_company_logo(session: AsyncSession, user_id: int, file: UploadFile):
        logger.info(f"Starting logo upload for company user_id: {user_id}")
        if not await ProfileRepository.get_company_by_user_id(session, user_id):
            logger.warning(f"Logo upload failed: Company profile not found for user_id {user_id}")
            raise HTTPException(status_code=404, detail="Профиль компании не найден")

        file_ext = file.filename.split('.')[-1]
        new_file_name = f"{uuid.uuid4()}.{file_ext}"
        file_path = os.path.join(LOGO_DIR, new_file_name)

        async with aiofiles.open(file_path, "wb") as buffer:
            await buffer.write(await file.read())

        logo_url = f"/profiles/uploads/logos/{new_file_name}"
        await ProfileRepository.update_logo_url(session, user_id, logo_url)
        logger.info(f"Company logo successfully saved for user_id {user_id}: {logo_url}")
        return {"logo_url": logo_url}

    @staticmethod
    async def upload_seeker_resume(session: AsyncSession, user_id: int, file: UploadFile):
        logger.info(f"Starting resume upload for user_id: {user_id}")
        if not await ProfileRepository.get_seeker_by_user_id(session, user_id):
            logger.warning(f"Resume upload failed: Profile not found for user_id {user_id}")
            raise HTTPException(status_code=404, detail="Профиль соискателя не найден")

        file_ext = file.filename.split('.')[-1]
        new_file_name = f"{uuid.uuid4()}.{file_ext}"
        file_path = os.path.join(RESUME_DIR, new_file_name)

        async with aiofiles.open(file_path, "wb") as buffer:
            await buffer.write(await file.read())

        file_url = f"/profiles/uploads/resumes/{new_file_name}"
        await ProfileRepository.add_resume(session, user_id, file_url, file.filename)
        logger.info(f"Resume '{file.filename}' successfully saved for user_id {user_id}")
        return {"file_url": file_url, "file_name": file.filename}

    @staticmethod
    async def handle_application_event(session: AsyncSession, data: dict):
        try:
            created_at = datetime.fromisoformat(data["created_at"]) if data.get("created_at") else datetime.utcnow()
            await ProfileRepository.add_application(
                session,
                app_id=data["app_id"],
                user_id=data["user_id"],
                vacancy_id=data["vacancy_id"],
                status=data["status"],
                created_at=created_at,
                vacancy_title=data.get("vacancy_title", "Unknown"),
                company_name=data.get("company_name", "Unknown")
            )
            logger.info(f"Application event (App ID: {data['app_id']}) registered in Profile Service.")
        except KeyError as e:
            logger.error(f"Failed to process application event, missing key: {e}")

    @staticmethod
    async def delete_user_profiles(session: AsyncSession, user_id: int):
        await ProfileRepository.delete_profiles_by_user_id(session, user_id)
        logger.info(f"All profiles completely removed for user_id {user_id}")