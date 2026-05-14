import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.db.database import get_db

from app.core.security import get_current_user_payload
from app.applications.schemas import ApplicationCreate, ApplicationResponse, ApplicationUpdateStatus
from app.applications.service import ApplicationService

router = APIRouter(prefix="/applications", tags=["Applications"])
logger = logging.getLogger(__name__)


@router.post("/", response_model=ApplicationResponse)
async def create_application(
        data: ApplicationCreate,
        payload: dict = Depends(get_current_user_payload),
        session: AsyncSession = Depends(get_db)
):
    # ЗМІНЕНО: перевіряємо роль 'worker'
    if payload.get("role") != "worker":
        logger.warning(f"HTTP 403: User ID {payload.get('id')} with role '{payload.get('role')}' tried to apply for a vacancy.")
        raise HTTPException(status_code=403, detail="Тільки шукачі можуть відгукуватися на вакансії")

    # Переконайся, що в токені ID лежить саме в полі 'id' або 'sub'
    user_id = payload.get("id") or payload.get("sub")
    logger.info(f"API Request: User ID {user_id} is applying for vacancy ID {data.vacancy_id}")
    return await ApplicationService.apply_for_vacancy(session, int(user_id), data)


@router.get("/seeker/me", response_model=List[ApplicationResponse])
async def get_my_applications(
        payload: dict = Depends(get_current_user_payload),
        session: AsyncSession = Depends(get_db)
):
    user_id = payload.get("id") or payload.get("sub")
    logger.info(f"API Request: User ID {user_id} requested their applications.")
    return await ApplicationService.get_my_applications(session, int(user_id))


@router.get("/vacancy/{vacancy_id}", response_model=List[ApplicationResponse])
async def get_vacancy_applications(
        vacancy_id: int,
        payload: dict = Depends(get_current_user_payload),
        session: AsyncSession = Depends(get_db)
):
    """Отримати всі відгуки на конкретну вакансію (для роботодавця)"""
    if payload.get("role") != "employer":
        logger.warning(f"HTTP 403: User ID {payload.get('id')} tried to view vacancy applications without employer role.")
        raise HTTPException(status_code=403, detail="Тільки роботодавці можуть бачити відгуки")

    logger.info(f"API Request: Employer ID {payload.get('id')} requested applications for vacancy ID {vacancy_id}.")
    return await ApplicationService.get_vacancy_applications(session, vacancy_id)


@router.patch("/{application_id}/status", response_model=ApplicationResponse)
async def update_status(
        application_id: int,
        data: ApplicationUpdateStatus,
        payload: dict = Depends(get_current_user_payload),
        session: AsyncSession = Depends(get_db)
):
    """Оновити статус відгуку (роботодавець перевів у 'Відмова' або 'Прийнято')"""
    if payload.get("role") != "employer":
        logger.warning(f"HTTP 403: User ID {payload.get('id')} tried to update application status without employer role.")
        raise HTTPException(status_code=403, detail="Тільки роботодавці можуть змінювати статус")

    logger.info(f"API Request: Employer ID {payload.get('id')} is updating status of application ID {application_id}.")
    return await ApplicationService.update_application_status(session, application_id, data)


@router.get("/", response_model=List[ApplicationResponse])
async def get_applications(
        vacancy_ids: List[int] = Query(default=None, description="Список ID вакансий для фильтрации"),
        payload: dict = Depends(get_current_user_payload),
        session: AsyncSession = Depends(get_db)
):
    if payload.get("role") != "employer":
        logger.warning(f"HTTP 403: User ID {payload.get('id')} tried to fetch multiple applications without employer role.")
        raise HTTPException(status_code=403, detail="Тільки роботодавці можуть бачити відгуки")

    logger.info(f"API Request: Employer ID {payload.get('id')} requested applications for vacancies: {vacancy_ids}")
    if not vacancy_ids:
        return []
    return await ApplicationService.get_applications_by_vacancy_ids(session, vacancy_ids)