import asyncio
import json
import aio_pika
from app.config import settings
from app.email_sender import send_email
from app.telegram_sender import send_telegram_admin_alert
from app.db.session import engine, AsyncSessionLocal
from app.db.models import Base
from app.repository import NotificationRepository


async def process_msg(message: aio_pika.IncomingMessage, queue_name: str):
    async with message.process():
        data = json.loads(message.body.decode())

        async with AsyncSessionLocal() as session:
            try:
                if queue_name == "email_verification_queue":
                    # Логика подтверждения почты
                    await send_email(data["to_email"], data["subject"], f"Ваше посилання: {data['verification_url']}")
                    await NotificationRepository.log_notification(session, "email", data["to_email"], data["subject"],
                                                                  "success")

                elif queue_name == "admin_approval_queue":
                    # Логика подтверждения админа (Email + Telegram подложка)
                    await send_email(data["to_email"], data["subject"], f"Новий адмін: {data['new_admin_email']}")

                    # ДУБЛИРУЕМ В ТЕЛЕГРАМ
                    await send_telegram_admin_alert(f"🔥 Нова заявка на адміна! Пошта: {data['new_admin_email']}")

                    await NotificationRepository.log_notification(session, "email", data["to_email"], data["subject"],
                                                                  "success")

                print(f"✅ [Done] {queue_name} processed")
            except Exception as e:
                print(f"❌ [Error] {e}")
                await NotificationRepository.log_notification(session, "email", "error", "error", "failed")


async def main():
    # Создаем таблицы логов
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    connection = await aio_pika.connect_robust(settings.RABBITMQ_URL)
    channel = await connection.channel()

    # Декларируем и слушаем очереди
    for q in ["email_verification_queue", "admin_approval_queue"]:
        queue = await channel.declare_queue(q, durable=True)
        await queue.consume(lambda m, name=q: process_msg(m, name))

    print("🚀 Notification Service LIVE! Listening for RabbitMQ events...")
    await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())