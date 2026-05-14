from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.applications.repository import ApplicationRepository
from app.applications.schemas import ApplicationCreate, ApplicationUpdateStatus
from app.core.messaging import EventPublisher


class ApplicationService:

    @staticmethod
    async def apply_for_vacancy(session: AsyncSession, seeker_id: int, data: ApplicationCreate):
        # 1. Проверяем, не откликался ли уже
        existing = await ApplicationRepository.check_existing(session, seeker_id, data.vacancy_id)
        if existing:
            raise HTTPException(status_code=400, detail="Ви вже відгукнулися на цю вакансію")

        # 2. Создаем отклик
        new_application = await ApplicationRepository.create(session, seeker_id, data)

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
        return await ApplicationRepository.get_by_seeker(session, seeker_id)

    @staticmethod
    async def get_vacancy_applications(session: AsyncSession, vacancy_id: int):
        return await ApplicationRepository.get_by_vacancy(session, vacancy_id)

    @staticmethod
    async def get_applications_by_vacancy_ids(session: AsyncSession, vacancy_ids: list[int]):
        return await ApplicationRepository.get_by_vacancy_ids(session, vacancy_ids)

    @staticmethod
    async def update_application_status(session: AsyncSession, application_id: int, data: ApplicationUpdateStatus):
        application = await ApplicationRepository.get_by_id(session, application_id)
        if not application:
            raise HTTPException(status_code=404, detail="Відгук не знайдено")

        if not data.status:
            raise HTTPException(status_code=400, detail="Статус не може бути порожнім")

        # Передаємо повідомлення в репозиторій
        updated_application = await ApplicationRepository.update_status(
            session, application, data.status, data.employer_message
        )

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