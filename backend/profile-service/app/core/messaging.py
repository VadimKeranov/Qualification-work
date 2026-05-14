import json
import aio_pika
import asyncio
import logging
from app.config import settings
from app.db.session import AsyncSessionLocal
from app.profiles.service import ProfileService
from app.profiles.schemas import JobSeekerUpdate, CompanyUpdate

# Ініціалізація логера
logger = logging.getLogger(__name__)

class EventConsumer:
    @staticmethod
    async def start_consuming():
        try:
            connection = await aio_pika.connect_robust(settings.RABBITMQ_URL)
            channel = await connection.channel()

            user_queue = await channel.declare_queue("user_created_queue", durable=True)
            delete_queue = await channel.declare_queue("user_deleted_queue", durable=True)
            app_queue = await channel.declare_queue("application_created_queue", durable=True)

            async def process_user_message(message: aio_pika.abc.AbstractIncomingMessage):
                async with message.process():
                    try:
                        data = json.loads(message.body.decode())
                        user_id, role = data.get("id") or data.get("user_id"), data.get("role")
                        if user_id and role:
                            logger.info(f"RabbitMQ: Processing user_created event for user_id {user_id} (Role: {role})")
                            async with AsyncSessionLocal() as session:
                                if role in ("worker", "seeker"):
                                    await ProfileService.update_my_seeker_profile(session, user_id, JobSeekerUpdate())
                                elif role == "employer":
                                    await ProfileService.update_my_company_profile(session, user_id, CompanyUpdate(company_name=f"Company_{user_id}"))
                    except Exception as e:
                        logger.error(f"RabbitMQ Consumer Error (user_queue): {e}")

            async def process_delete_message(message: aio_pika.abc.AbstractIncomingMessage):
                async with message.process():
                    try:
                        data = json.loads(message.body.decode())
                        if user_id := data.get("user_id"):
                            logger.info(f"RabbitMQ: Processing user_deleted event for user_id {user_id}")
                            async with AsyncSessionLocal() as session:
                                await ProfileService.delete_user_profiles(session, user_id)
                    except Exception as e:
                        logger.error(f"RabbitMQ Consumer Error (delete_queue): {e}")

            async def process_application_message(message: aio_pika.abc.AbstractIncomingMessage):
                async with message.process():
                    try:
                        data = json.loads(message.body.decode())
                        logger.info(f"RabbitMQ: Processing application_created event (App ID: {data.get('app_id')})")
                        async with AsyncSessionLocal() as session:
                            await ProfileService.handle_application_event(session, data)
                    except Exception as e:
                        logger.error(f"RabbitMQ Consumer Error (application_queue): {e}")

            await user_queue.consume(process_user_message)
            await delete_queue.consume(process_delete_message)
            await app_queue.consume(process_application_message)

            logger.info("Profile Worker successfully connected to RabbitMQ and started consuming messages...")
            await asyncio.Future()
        except Exception as e:
            logger.critical(f"Failed to start Profile Worker: {e}", exc_info=True)