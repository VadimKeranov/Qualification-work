import json
import aio_pika
import logging
from app.config import settings

logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

class EventProducer:
    @staticmethod
    async def _publish_message(queue_name: str, message_body: dict):
        try:
            # Використовуємо URL з конфігу
            connection = await aio_pika.connect_robust(settings.RABBITMQ_URL)
            async with connection:
                channel = await connection.channel()
                await channel.declare_queue(queue_name, durable=True)

                await channel.default_exchange.publish(
                    aio_pika.Message(
                        body=json.dumps(message_body).encode(),
                        delivery_mode=aio_pika.DeliveryMode.PERSISTENT
                    ),
                    routing_key=queue_name
                )
            log.info(f"Сообщение успішно відправлено в чергу '{queue_name}': {message_body}")
        except Exception as e:
            log.error(f"Помилка RabbitMQ при відправці в чергу '{queue_name}': {e}")

    @staticmethod
    async def publish_user_created(user_id: int, role: str):
        await EventProducer._publish_message("user_created_queue", {"id": user_id, "role": role})

    @staticmethod
    async def publish_user_deleted(user_id: int):
        await EventProducer._publish_message("user_deleted_queue", {"user_id": user_id})

    @staticmethod
    async def publish_admin_approval_required(new_admin_email: str, approval_token: str):
        message = {
            "to_email": settings.MAIN_ADMIN_EMAIL,
            "subject": "Підтвердження реєстрації нового Адміністратора",
            "new_admin_email": new_admin_email,
            "approval_url": f"{settings.FRONTEND_URL}/admin/confirm?token={approval_token}"
        }
        await EventProducer._publish_message("admin_approval_queue", message)


    @staticmethod
    async def publish_email_verification(email: str, verification_token: str):
        message = {
            "to_email": email,
            "subject": "Підтвердження реєстрації на платформі JobFlow",
            # Ссылка ведет на твой фронтенд
            "verification_url": f"{settings.FRONTEND_URL}/verify-email?token={verification_token}"
        }
        await EventProducer._publish_message("email_verification_queue", message)