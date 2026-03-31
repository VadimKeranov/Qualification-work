import shutil
import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from app.dependencies import get_db
from app.utils.security import get_current_user_payload
from app.schemas.profile import JobSeekerResponse, JobSeekerUpdate, CompanyResponse, CompanyUpdate
from app.profile_service import ProfileService
from app.profile_repository import ProfileRepository


router = APIRouter(prefix="/profiles", tags=["Profiles"])

@router.get("/seeker/me", response_model=JobSeekerResponse)
async def get_my_seeker_profile(
        payload: dict = Depends(get_current_user_payload),
        session: AsyncSession = Depends(get_db)
):
    user_id = payload.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")

    profile = await ProfileService.get_my_seeker_profile(session, user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


@router.put("/seeker/me", response_model=JobSeekerResponse)
async def update_my_seeker_profile(
        data: JobSeekerUpdate,
        payload: dict = Depends(get_current_user_payload),
        session: AsyncSession = Depends(get_db)
):
    user_id = payload.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")

    return await ProfileService.update_my_seeker_profile(session, user_id, data)


@router.get("/company/me", response_model=CompanyResponse)
async def get_my_company_profile(
        payload: dict = Depends(get_current_user_payload),
        session: AsyncSession = Depends(get_db)
):

    user_id = payload.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")

    profile = await ProfileService.get_my_company_profile(session, user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


@router.put("/company/me", response_model=CompanyResponse)
async def update_my_company_profile(
        data: CompanyUpdate,
        payload: dict = Depends(get_current_user_payload),
        session: AsyncSession = Depends(get_db)
):
    user_id = payload.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")

    return await ProfileService.update_my_company_profile(session, user_id, data)


@router.post("/seeker/me/upload-photo")
async def upload_seeker_photo(
        file: UploadFile = File(...),
        payload: dict = Depends(get_current_user_payload),
        session: AsyncSession = Depends(get_db)
):
    user_id = payload.get("id")

    # Генерируем уникальное имя файла
    ext = file.filename.split(".")[-1]
    filename = f"user_{user_id}_{uuid.uuid4().hex[:8]}.{ext}"
    filepath = f"uploads/photos/{filename}"

    # Сохраняем файл на диск
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Обновляем профиль в БД
    profile = await ProfileService.get_my_seeker_profile(session, user_id)
    if profile:
        profile.photo_url = f"/profiles/{filepath}"
        await session.commit()

    return {"status": "success", "photo_url": f"/profiles/{filepath}"}


@router.post("/seeker/me/upload-resume")
async def upload_seeker_resume(
        file: UploadFile = File(...),
        payload: dict = Depends(get_current_user_payload),
        session: AsyncSession = Depends(get_db)
):
    user_id = payload.get("id")

    # 1. Проверяем лимит (не более 3 резюме)
    resumes_count = await ProfileRepository.count_resumes(session, user_id)
    if resumes_count >= 3:
        raise HTTPException(status_code=400, detail="Достигнут лимит: максимум 3 резюме.")

    ext = file.filename.split(".")[-1]
    if ext.lower() not in ["pdf", "doc", "docx"]:
        raise HTTPException(status_code=400, detail="Только файлы PDF, DOC или DOCX.")

    # 2. Ленивое создание: если профиля еще нет - создаем пустой
    profile = await ProfileRepository.get_seeker_by_user_id(session, user_id)
    if not profile:
        await ProfileRepository.upsert_seeker(session, user_id, JobSeekerUpdate())

    # 3. Сохраняем файл физически
    filename = f"resume_{user_id}_{uuid.uuid4().hex[:8]}.{ext}"
    filepath = f"uploads/resumes/{filename}"

    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # 4. Сохраняем запись в новую таблицу
    file_url = f"/profiles/{filepath}"
    await ProfileRepository.add_resume(session, user_id, file_url, file.filename)

    return {"status": "success", "resume_file_url": file_url, "file_name": file.filename}