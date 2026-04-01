import os
import uuid
from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from app.profiles.repository import ProfileRepository
from app.profiles.schemas import JobSeekerUpdate, CompanyUpdate

UPLOAD_DIR = "uploads"
PHOTO_DIR = os.path.join(UPLOAD_DIR, "photos")
RESUME_DIR = os.path.join(UPLOAD_DIR, "resumes")
os.makedirs(UPLOAD_DIR, exist_ok=True)

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


    @staticmethod
    async def delete_resume(session: AsyncSession, resume_id: int, user_id: int):
        return await ProfileRepository.delete_resume(session, resume_id, user_id)


    @staticmethod
    async def upload_seeker_photo(session: AsyncSession, user_id: int, file: UploadFile):
        ext = file.filename.split(".")[-1]
        filename = f"{uuid.uuid4()}.{ext}"

        # 2. Сохраняем файл именно в папку PHOTOS
        filepath = os.path.join(PHOTO_DIR, filename)

        content = await file.read()
        with open(filepath, "wb") as f:
            f.write(content)

        # 3. Формируем правильный URL с учетом папки photos
        file_url = f"http://localhost:8000/profiles/uploads/photos/{filename}"

        # Обновляем базу данных
        await ProfileRepository.update_photo_url(session, user_id, file_url)
        return {"message": "Фото успешно загружено", "photo_url": file_url}

    @staticmethod
    async def upload_seeker_resume(session: AsyncSession, user_id: int, file: UploadFile):
        ext = file.filename.split(".")[-1]
        filename = f"{uuid.uuid4()}.{ext}"

        # 2. Сохраняем файл именно в папку RESUMES
        filepath = os.path.join(RESUME_DIR, filename)

        content = await file.read()
        with open(filepath, "wb") as f:
            f.write(content)

        # 3. Формируем правильный URL с учетом папки resumes
        file_url = f"http://localhost:8000/profiles/uploads/resumes/{filename}"

        await ProfileRepository.add_resume(session, user_id, file_url, file.filename)
        return {"message": "Резюме успешно загружено", "file_url": file_url}