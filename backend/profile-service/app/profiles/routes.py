import logging
from typing import Union, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Response
from sqlalchemy.ext.asyncio import AsyncSession

from sqlalchemy import select
from app.db.models import Locality, Region

from app.core.dependencies import get_db
from app.utils.security import get_current_user_payload
from app.profiles.schemas import (
    JobSeekerResponse,
    JobSeekerUpdate,
    CompanyResponse,
    CompanyUpdate
)
from app.profiles.service import ProfileService

router = APIRouter(tags=["Profiles"])
logger = logging.getLogger(__name__)


@router.get("/seeker/me", response_model=Union[JobSeekerResponse, None])
async def get_my_seeker_profile(
        response: Response,
        payload: dict = Depends(get_current_user_payload),
        session: AsyncSession = Depends(get_db)
):
    user_id = payload.get("id")
    if not user_id:
        logger.error("HTTP 401: Unauthorized access attempt to get_my_seeker_profile. User ID not found in token.")
        raise HTTPException(status_code=401, detail="User ID not found in token")

    logger.info(f"API Request: Fetching seeker profile for user_id: {user_id}")
    profile = await ProfileService.get_my_seeker_profile(session, user_id)
    if not profile:
        logger.info(f"Seeker profile for user_id {user_id} not found. Returning empty state.")
        response.status_code = 200  # Явно указываем, что все ОК
        return None  # Возвращаем null, если профиля нет
    return profile


@router.put("/seeker/me", response_model=JobSeekerResponse)
async def update_my_seeker_profile(
        data: JobSeekerUpdate,
        payload: dict = Depends(get_current_user_payload),
        session: AsyncSession = Depends(get_db)
):
    user_id = payload.get("id")
    if not user_id:
        logger.error("HTTP 401: Unauthorized access attempt to update_my_seeker_profile.")
        raise HTTPException(status_code=401, detail="User ID not found in token")

    logger.info(f"API Request: Updating seeker profile for user_id: {user_id}")
    return await ProfileService.update_my_seeker_profile(session, user_id, data)



@router.get("/company/me", response_model=Union[CompanyResponse, None])
async def get_my_company_profile(
        response: Response,
        payload: dict = Depends(get_current_user_payload),
        session: AsyncSession = Depends(get_db)
):
    user_id = payload.get("id")
    if not user_id:
        logger.error("HTTP 401: Unauthorized access attempt to get_my_company_profile.")
        raise HTTPException(status_code=401, detail="User ID not found in token")

    logger.info(f"API Request: Fetching company profile for user_id: {user_id}")
    # Вызываем правильный метод из очищенного ProfileService
    profile = await ProfileService.get_my_company_profile(session, user_id)

    if not profile:
        logger.info(f"Company profile for user_id {user_id} not found. Returning empty state.")
        response.status_code = 200
        return None
    return profile


@router.put("/company/me", response_model=CompanyResponse)
async def update_my_company_profile(
        data: CompanyUpdate,
        payload: dict = Depends(get_current_user_payload),
        session: AsyncSession = Depends(get_db)
):
    user_id = payload.get("id")
    if not user_id:
        logger.error("HTTP 401: Unauthorized access attempt to update_my_company_profile.")
        raise HTTPException(status_code=401, detail="User ID not found in token")

    logger.info(f"API Request: Updating company profile for user_id: {user_id}")
    return await ProfileService.update_my_company_profile(session, user_id, data)


@router.get("/seekers", response_model=List[JobSeekerResponse])
async def get_all_seekers(session: AsyncSession = Depends(get_db)):
    logger.info("API Request: Fetching all seekers profiles.")
    return await ProfileService.get_all_seekers(session)


@router.post("/seeker/me/upload-photo")
async def upload_seeker_photo_route(
        file: UploadFile = File(...),
        payload: dict = Depends(get_current_user_payload),
        session: AsyncSession = Depends(get_db)
):
    user_id = payload.get("id")
    if not user_id:
        logger.error("HTTP 401: Unauthorized access attempt to upload_seeker_photo_route.")
        raise HTTPException(status_code=401, detail="User ID not found in token")

    logger.info(f"API Request: User {user_id} is uploading a photo: {file.filename}")
    # Делегируем всю работу сервису
    return await ProfileService.upload_seeker_avatar(session, user_id, file)


@router.post("/seeker/me/upload-resume")
async def upload_seeker_resume_route(
        file: UploadFile = File(...),
        payload: dict = Depends(get_current_user_payload),
        session: AsyncSession = Depends(get_db)
):
    user_id = payload.get("id")
    if not user_id:
        logger.error("HTTP 401: Unauthorized access attempt to upload_seeker_resume_route.")
        raise HTTPException(status_code=401, detail="User ID not found in token")

    logger.info(f"API Request: User {user_id} is uploading a resume: {file.filename}")
    return await ProfileService.upload_seeker_resume(session, user_id, file)


@router.delete("/seeker/me/resumes/{resume_id}")
async def delete_seeker_resume_route(
        resume_id: int,
        payload: dict = Depends(get_current_user_payload),
        session: AsyncSession = Depends(get_db)
):
    user_id = payload.get("id")
    if not user_id:
        logger.error("HTTP 401: Unauthorized access attempt to delete_seeker_resume_route.")
        raise HTTPException(status_code=401, detail="User ID not found in token")

    logger.info(f"API Request: User {user_id} is attempting to delete resume ID: {resume_id}")
    success = await ProfileService.delete_resume(session, resume_id, user_id)

    if not success:
        logger.warning(f"HTTP 404: Resume ID {resume_id} not found for deletion by user {user_id}.")
        raise HTTPException(status_code=404, detail="Резюме не найдено")

    logger.info(f"Resume ID {resume_id} successfully deleted by user {user_id}.")
    return {"message": "Резюме удалено"}


@router.get("/seeker/{user_id}", response_model=JobSeekerResponse)
async def get_public_seeker_profile(
        user_id: int,
        session: AsyncSession = Depends(get_db)
):
    logger.info(f"API Request: Fetching public seeker profile for user_id: {user_id}")
    profile = await ProfileService.get_my_seeker_profile(session, user_id)
    if not profile:
        logger.warning(f"HTTP 404: Public seeker profile for user_id {user_id} not found.")
        raise HTTPException(status_code=404, detail="Профіль не знайдено")
    return profile


@router.get("/company/{company_id}", response_model=CompanyResponse)
async def get_public_company_profile(
        company_id: int,
        session: AsyncSession = Depends(get_db)
):
    logger.info(f"API Request: Fetching public company profile for company_id/user_id: {company_id}")
    profile = await ProfileService.get_my_company_profile(session, company_id)

    if not profile:
        logger.warning(f"HTTP 404: Public company profile for user_id {company_id} not found.")
        raise HTTPException(status_code=404, detail="Company not found")
    return profile


@router.get("/locations/search")
async def search_locations(q: str, session: AsyncSession = Depends(get_db)):
    if len(q) < 2:
        return []

    logger.info(f"API Request: Searching locations with query: '{q}'")

    # 1. Шукаємо збіги по РЕГІОНАХ (Областях)
    regions_query = (
        select(Region.name)
        .where(Region.name.ilike(f"{q}%"))
        .limit(5)
    )
    regions_result = await session.execute(regions_query)
    regions = regions_result.scalars().all()

    # 2. Шукаємо збіги по МІСТАХ ТА СЕЛАХ
    localities_query = (
        select(Locality.name, Region.name.label("region_name"), Locality.type)
        .join(Region)
        .where(Locality.name.ilike(f"{q}%"))
        .order_by(Locality.name)
        .limit(20)
    )
    localities_result = await session.execute(localities_query)
    localities = localities_result.all()

    # Списки для сортування
    cities = []
    regions_list = []
    others = []

    # Обробляємо області
    for reg in regions:
        reg_lower = reg.lower()
        if "область" in reg_lower:
            regions_list.append({"label": f"📍 Вся {reg}", "value": reg})
        elif "крим" in reg_lower:
            regions_list.append({"label": f"📍 {reg}", "value": reg})

    # Обробляємо населені пункти (без приставки типу)
    for loc in localities:
        item = {
            "label": f"{loc.name} ({loc.region_name})",
            "value": f"{loc.name} ({loc.region_name})"
        }

        # Сортуємо: міста окремо, інші окремо
        if loc.type and loc.type.lower() == "місто":
            cities.append(item)
        else:
            others.append(item)

    # Повертаємо у правильному порядку: Міста -> Вся Область -> Інші населені пункти
    return cities + regions_list + others


@router.post("/company/me/upload-logo")
async def upload_company_logo_route(
        file: UploadFile = File(...),
        payload: dict = Depends(get_current_user_payload),
        session: AsyncSession = Depends(get_db)
):
    user_id = payload.get("id")
    if not user_id:
        logger.error("HTTP 401: Unauthorized access attempt to upload_company_logo_route.")
        raise HTTPException(status_code=401, detail="User ID not found in token")

    logger.info(f"API Request: User {user_id} is uploading a company logo: {file.filename}")
    return await ProfileService.upload_company_logo(session, user_id, file)