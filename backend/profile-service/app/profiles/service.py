import os
import uuid
import aiofiles # Обязательно: pip install aiofiles
from datetime import datetime
from fastapi import UploadFile, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.profiles.repository import ProfileRepository
from app.profiles.schemas import JobSeekerUpdate, CompanyUpdate

UPLOAD_DIR = "uploads"
AVATAR_DIR = os.path.join(UPLOAD_DIR, "avatars")
LOGO_DIR = os.path.join(UPLOAD_DIR, "logos")
RESUME_DIR = os.path.join(UPLOAD_DIR, "resumes")

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
        return await ProfileRepository.upsert_seeker(session, user_id, data)

    @staticmethod
    async def update_my_company_profile(session: AsyncSession, user_id: int, data: CompanyUpdate):
        return await ProfileRepository.upsert_company(session, user_id, data)

    @staticmethod
    async def delete_resume(session: AsyncSession, resume_id: int, user_id: int):
        return await ProfileRepository.delete_resume(session, resume_id, user_id)

    @staticmethod
    async def handle_application_event(session: AsyncSession, data: dict):
        # Парсинг даты происходит здесь, а не в репозитории
        created_at = datetime.fromisoformat(data["created_at"])
        return await ProfileRepository.add_application(
            session, data["id"], data["user_id"], data["vacancy_id"],
            data["status"], created_at, data["vacancy_title"], data["company_name"]
        )

    @staticmethod
    async def delete_user_profiles(session: AsyncSession, user_id: int):
        await ProfileRepository.delete_profiles_by_user_id(session, user_id)

    # --- РАБОТА С ФАЙЛАМИ (Асинхронно) ---
    @staticmethod
    async def upload_seeker_photo(session: AsyncSession, user_id: int, file: UploadFile):
        if not await ProfileRepository.get_seeker_by_user_id(session, user_id):
            raise HTTPException(status_code=404, detail="Профиль соискателя не найден")

        file_ext = file.filename.split('.')[-1]
        new_file_name = f"{uuid.uuid4()}.{file_ext}"
        file_path = os.path.join(AVATAR_DIR, new_file_name)

        async with aiofiles.open(file_path, "wb") as buffer:
            await buffer.write(await file.read())

        photo_url = f"/profiles/uploads/avatars/{new_file_name}"
        await ProfileRepository.update_photo_url(session, user_id, photo_url)
        return {"photo_url": photo_url}

    @staticmethod
    async def upload_company_logo(session: AsyncSession, user_id: int, file: UploadFile):
        if not await ProfileRepository.get_company_by_user_id(session, user_id):
            raise HTTPException(status_code=404, detail="Профиль компании не найден")

        file_ext = file.filename.split('.')[-1]
        new_file_name = f"{uuid.uuid4()}.{file_ext}"
        file_path = os.path.join(LOGO_DIR, new_file_name)

        async with aiofiles.open(file_path, "wb") as buffer:
            await buffer.write(await file.read())

        logo_url = f"/profiles/uploads/logos/{new_file_name}"
        await ProfileRepository.update_logo_url(session, user_id, logo_url)
        return {"logo_url": logo_url}

    @staticmethod
    async def upload_seeker_resume(session: AsyncSession, user_id: int, file: UploadFile):
        if not await ProfileRepository.get_seeker_by_user_id(session, user_id):
            raise HTTPException(status_code=404, detail="Профиль соискателя не найден")

        file_ext = file.filename.split('.')[-1]
        new_file_name = f"{uuid.uuid4()}.{file_ext}"
        file_path = os.path.join(RESUME_DIR, new_file_name)

        async with aiofiles.open(file_path, "wb") as buffer:
            await buffer.write(await file.read())

        file_url = f"/profiles/uploads/resumes/{new_file_name}"
        await ProfileRepository.add_resume(session, user_id, file_url, file.filename)
        return {"file_url": file_url, "file_name": file.filename}