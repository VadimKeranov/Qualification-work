from typing import Union
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db
from app.utils.security import get_current_user_payload
from app.profiles.schemas import (
    JobSeekerResponse, 
    JobSeekerUpdate, 
    CompanyResponse, 
    CompanyUpdate, 
    CompanyProfileWithVacancies
)
from app.profiles.service import ProfileService

router = APIRouter(tags=["Profiles"])

# --- Роуты для Соискателя (Job Seeker) ---

@router.get("/seeker/me", response_model=Union[JobSeekerResponse, None])
async def get_my_seeker_profile(
        response: Response,
        payload: dict = Depends(get_current_user_payload),
        session: AsyncSession = Depends(get_db)
):
    user_id = payload.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")

    profile = await ProfileService.get_my_seeker_profile(session, user_id)
    if not profile:
        response.status_code = 200 # Явно указываем, что все ОК
        return None # Возвращаем null, если профиля нет
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

# --- Роуты для Компании (Company) ---

@router.get("/company/me", response_model=Union[CompanyProfileWithVacancies, None])
async def get_my_company_profile(
        response: Response,
        payload: dict = Depends(get_current_user_payload),
        session: AsyncSession = Depends(get_db)
):
    user_id = payload.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")

    profile = await ProfileService.get_my_company_profile(session, user_id)
    
    if not profile:
        response.status_code = 200 # Явно указываем, что все ОК
        return None # Возвращаем null, если профиля нет
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
async def upload_seeker_photo_route(
        file: UploadFile = File(...),
        payload: dict = Depends(get_current_user_payload),
        session: AsyncSession = Depends(get_db)
):
    user_id = payload.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")

    # Делегируем всю работу сервису
    return await ProfileService.upload_seeker_photo(session, user_id, file)


@router.post("/seeker/me/upload-resume")
async def upload_seeker_resume_route(
        file: UploadFile = File(...),
        payload: dict = Depends(get_current_user_payload),
        session: AsyncSession = Depends(get_db)
):
    user_id = payload.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")

    return await ProfileService.upload_seeker_resume(session, user_id, file)


@router.delete("/seeker/me/resumes/{resume_id}")
async def delete_seeker_resume_route(
        resume_id: int,
        payload: dict = Depends(get_current_user_payload),
        session: AsyncSession = Depends(get_db)
):
    user_id = payload.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")

    success = await ProfileService.delete_resume(session, resume_id, user_id)

    if not success:
        raise HTTPException(status_code=404, detail="Резюме не найдено")

    return {"message": "Резюме удалено"}


@router.post("/company/{company_id}", response_model=CompanyResponse)
async def get_public_company_profile(
        user_id: int,
        session: AsyncSession = Depends(get_db)
):
    profile = await ProfileService.get_my_company_profile(session, user_id)

    if not profile:
        raise HTTPException(status_code=401, detail="Company not found")
    return profile


from sqlalchemy import select
from app.db.models import Locality, Region


@router.get("/locations/search")
async def search_locations(q: str, session: AsyncSession = Depends(get_db)):
    if len(q) < 2:
        return []

    # Ищем города, название которых начинается на введенные буквы
    query = (
        select(Locality.name, Region.name.label("region_name"))
        .join(Region)
        .where(Locality.name.ilike(f"{q}%"))
        .limit(10)
    )

    result = await session.execute(query)
    locations = result.all()

    # Возвращаем список строк в формате "Город (Область)"
    return [{"label": f"{loc.name} ({loc.region_name})", "value": f"{loc.name} ({loc.region_name})"} for loc in
            locations]