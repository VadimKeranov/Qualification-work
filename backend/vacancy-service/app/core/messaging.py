import asyncio
import json
import aio_pika
import logging
from app.config import settings
from app.db.database import AsyncSessionLocal
from app.vacancies.repository import VacancyRepository

logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

class EventConsumer:
    @staticmethod
    async def _process_application_created(message: aio_pika.IncomingMessage):
        """Обработчик события создания отклика."""
        async with message.process():
            try:
                data = json.loads(message.body.decode())
                vacancy_id = data.get("vacancy_id")

                if not vacancy_id:
                    log.warning("Получено сообщение без vacancy_id")
                    return

                async with AsyncSessionLocal() as session:
                    await VacancyRepository.increment_applications_count(session, vacancy_id)
                    log.info(f"Счетчик откликов для вакансии {vacancy_id} увеличен.")
            except Exception as e:
                log.error(f"Ошибка при обработке сообщения application_created: {e}")

    @classmethod
    async def start_consuming(cls):
        """Запускает потребителя событий RabbitMQ."""
        log.info("Запуск потребителя событий в Vacancy Service...")
        try:
            connection = await aio_pika.connect_robust(settings.RABBITMQ_URL)
            async with connection:
                channel = await connection.channel()
                
                queue = await channel.declare_queue("application_created_queue", durable=True)
                await queue.consume(cls._process_application_created)

                log.info("Потребитель запущен. Ожидание сообщений...")
                await asyncio.Future()
        except asyncio.CancelledError:
            log.info("Потребитель остановлен.")
        except Exception as e:
            log.error(f"Критическая ошибка потребителя RabbitMQ в Vacancy Service: {e}")
