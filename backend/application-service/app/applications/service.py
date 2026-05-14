import logging
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.applications.repository import ApplicationRepository
from app.applications.schemas import ApplicationCreate, ApplicationUpdateStatus
from app.core.messaging import EventPublisher

# Ініціалізація логера
logger = logging.getLogger(__name__)


class ApplicationService:

    @staticmethod
    async def apply_for_vacancy(session: AsyncSession, seeker_id: int, data: ApplicationCreate):
        logger.info(f"Seeker ID {seeker_id} is applying for vacancy ID {data.vacancy_id}")

        # 1. Проверяем, не откликался ли уже
        existing = await ApplicationRepository.check_existing(session, seeker_id, data.vacancy_id)
        if existing:
            logger.warning(
                f"Application failed: Seeker ID {seeker_id} already applied for vacancy ID {data.vacancy_id}")
            raise HTTPException(status_code=400, detail="Ви вже відгукнулися на цю вакансію")

        # 2. Создаем отклик
        new_application = await ApplicationRepository.create(session, seeker_id, data)
        logger.info(f"Application (ID: {new_application.id}) created successfully.")

        # 3. Публикуем событие в RabbitMQ
        await EventPublisher.publish(
            "application_created_queue",
            {
                "id": new_application.id,
                "seeker_id": new_application.seeker_id,
                "vacancy_id": new_application.vacancy_id,
                "status": new_application.status,
                "created_at": new_application.created_at.isoformat(),
            }
        )

        return new_application

    @staticmethod
    async def get_my_applications(session: AsyncSession, seeker_id: int):
        logger.info(f"Fetching applications for seeker ID: {seeker_id}")
        return await ApplicationRepository.get_by_seeker(session, seeker_id)

    @staticmethod
    async def get_vacancy_applications(session: AsyncSession, vacancy_id: int):
        logger.info(f"Fetching applications for vacancy ID: {vacancy_id}")
        return await ApplicationRepository.get_by_vacancy(session, vacancy_id)

    @staticmethod
    async def get_applications_by_vacancy_ids(session: AsyncSession, vacancy_ids: list[int]):
        logger.info(f"Fetching applications for multiple vacancies: {vacancy_ids}")
        return await ApplicationRepository.get_by_vacancy_ids(session, vacancy_ids)

    @staticmethod
    async def update_application_status(session: AsyncSession, application_id: int, data: ApplicationUpdateStatus):
        logger.info(f"Attempting to update status for application ID {application_id} to '{data.status}'")

        application = await ApplicationRepository.get_by_id(session, application_id)
        if not application:
            logger.warning(f"Status update failed: Application ID {application_id} not found.")
            raise HTTPException(status_code=404, detail="Відгук не знайдено")

        if not data.status:
            logger.warning(f"Status update failed for application ID {application_id}: Empty status provided.")
            raise HTTPException(status_code=400, detail="Статус не може бути порожнім")

        # Передаємо повідомлення в репозиторій
        updated_application = await ApplicationRepository.update_status(
            session, application, data.status, data.employer_message
        )
        logger.info(f"Application ID {application_id} status updated successfully to '{updated_application.status}'")

        await EventPublisher.publish(
            "application_updated_queue",
            {
                "id": updated_application.id,
                "seeker_id": updated_application.seeker_id,
                "vacancy_id": updated_application.vacancy_id,
                "status": updated_application.status
            }
        )

        return updated_application