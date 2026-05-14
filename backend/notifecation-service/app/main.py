import asyncio
import json
import logging
import aio_pika
from app.config import settings
from app.email_sender import send_email
from app.telegram_sender import send_telegram_admin_alert
from app.db.session import engine, AsyncSessionLocal
from app.db.models import Base
from app.repository import NotificationRepository

# Ініціалізація логера
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("notification-service")

async def process_msg(message: aio_pika.IncomingMessage, queue_name: str):
    async with message.process():
        try:
            data = json.loads(message.body.decode())
            logger.info(f"Processing message from queue '{queue_name}' for: {data.get('to_email', 'N/A')}")

            async with AsyncSessionLocal() as session:
                if queue_name == "email_verification_queue":
                    # Логіка підтвердження пошти
                    await send_email(data["to_email"], data["subject"], f"Ваше посилання: {data['verification_url']}")
                    await NotificationRepository.log_notification(session, "email", data["to_email"], data["subject"], "success")
                    logger.info(f"Verification email sent to {data['to_email']}.")

                elif queue_name == "admin_approval_queue":
                    # Логіка підтвердження адміна (Email + Telegram підложка)
                    await send_email(data["to_email"], data["subject"], f"Новий адмін: {data['new_admin_email']}")
                    logger.info(f"Admin approval email sent to {data['to_email']}.")

                    # ДУБЛЮЄМО В ТЕЛЕГРАМ
                    await send_telegram_admin_alert(f"🔥 Нова заявка на адміна! Пошта: {data['new_admin_email']}")

                    await NotificationRepository.log_notification(session, "email", data["to_email"], data["subject"], "success")

                logger.info(f"✅ Successfully processed message from {queue_name}")

        except Exception as e:
            logger.error(f"❌ Error processing message from {queue_name}: {str(e)}", exc_info=True)
            async with AsyncSessionLocal() as session:
                await NotificationRepository.log_notification(session, "email", "error", "error", "failed")

async def main():
    logger.info("Starting Notification Service...")
    # Створюємо таблиці логів
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    try:
        connection = await aio_pika.connect_robust(settings.RABBITMQ_URL)
        channel = await connection.channel()

        # Декларуємо і слухаємо черги
        for q in ["email_verification_queue", "admin_approval_queue"]:
            queue = await channel.declare_queue(q, durable=True)
            await queue.consume(lambda m, name=q: process_msg(m, name))
            logger.info(f"Started consuming from queue: {q}")

        logger.info("Notification Service is running and waiting for messages. To exit press CTRL+C")
        await asyncio.Future()  # Безкінечний цикл
    except Exception as e:
        logger.critical(f"Failed to connect to RabbitMQ: {str(e)}")

if __name__ == "__main__":
    asyncio.run(main())