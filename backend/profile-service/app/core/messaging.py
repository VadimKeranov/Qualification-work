import asyncio
import json
import aio_pika
import logging
from app.db.session import AsyncSessionLocal
from app.profiles.repository import ProfileRepository
from app.profiles.schemas import JobSeekerUpdate, CompanyUpdate
from app.config import settings # <--- Импортируем settings

logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

class EventConsumer:
    @staticmethod
    async def _process_user_created(message: aio_pika.IncomingMessage):
        async with message.process():
            try:
                data = json.loads(message.body.decode())
                user_id = data.get("id")
                role = data.get("role")

                async with AsyncSessionLocal() as session:
                    if role == "worker":
                        empty_data = JobSeekerUpdate(first_name="", last_name="")
                        await ProfileRepository.upsert_seeker(session, user_id, empty_data)
                        log.info(f"Профиль соискателя создан для user_id: {user_id}")
                    elif role == "employer":
                        empty_data = CompanyUpdate(company_name=f"Компания #{user_id}")
                        await ProfileRepository.upsert_company(session, user_id, empty_data)
                        log.info(f"Профиль компании создан для user_id: {user_id}")
                    elif role == "admin":
                        log.info(f"Admin created (ID: {user_id}), skipping profile creation.")
            except Exception as e:
                log.error(f"Ошибка при обработке сообщения user_created: {e}")


    @staticmethod
    async def _process_user_deleted(message: aio_pika.IncomingMessage):
        async with message.process():
            try:
                data = json.loads(message.body.decode())
                user_id = data.get("user_id")

                async with AsyncSessionLocal() as session:
                    log.info(f"Получена команда на удаление для user_id: {user_id}")
                    await ProfileRepository.delete_profiles_by_user_id(session, user_id)
                    log.info(f"Профили для user_id: {user_id} удалены.")
            except Exception as e:
                log.error(f"Ошибка при обработке сообщения user_deleted: {e}")

    @classmethod
    async def start_consuming(cls):
        log.info("Запуск потребителя событий RabbitMQ...")
        try:
            connection = await aio_pika.connect_robust(settings.RABBITMQ_URL) # <--- Используем settings
            async with connection:
                channel = await connection.channel()
                
                queue_created = await channel.declare_queue("user_created_queue", durable=True)
                await queue_created.consume(cls._process_user_created)

                queue_deleted = await channel.declare_queue("user_deleted_queue", durable=True)
                await queue_deleted.consume(cls._process_user_deleted)

                log.info("Потребитель запущен. Ожидание сообщений...")
                await asyncio.Future()
        except asyncio.CancelledError:
            log.info("Потребитель остановлен.")
        except Exception as e:
            log.error(f"Критическая ошибка потребителя RabbitMQ: {e}")
