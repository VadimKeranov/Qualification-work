import asyncio
import json
import aio_pika
import logging
from app.db.database import AsyncSessionLocal  # <--- ИСПРАВЛЕНО ЗДЕСЬ
from app.vacancies.repository import VacancyRepository
from app.config import settings

logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)


async def process_company_update(message: aio_pika.IncomingMessage):
    async with message.process():
        try:
            data = json.loads(message.body.decode())
            company_id = data.get("company_id")
            name = data.get("company_name")
            logo = data.get("company_logo")

            async with AsyncSessionLocal() as session:
                await VacancyRepository.sync_company_data(session, company_id, name, logo)
                log.info(f"Обновлены вакансии для компании ID: {company_id}")
        except Exception as e:
            log.error(f"Ошибка при обработке company_update: {e}")


async def main():
    log.info("Запуск потребителя событий Vacancy Service...")
    try:
        connection = await aio_pika.connect_robust(settings.RABBITMQ_URL)
        async with connection:
            channel = await connection.channel()

            queue = await channel.declare_queue("company_updated_queue", durable=True)
            await queue.consume(process_company_update)

            log.info("Потребитель запущен. Ожидание сообщений...")
            await asyncio.Future()
    except Exception as e:
        log.error(f"Критическая ошибка потребителя RabbitMQ: {e}")


if __name__ == "__main__":
    asyncio.run(main())