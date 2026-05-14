import json
import aio_pika
import asyncio
from app.config import settings
from app.db.session import AsyncSessionLocal
from app.profiles.service import ProfileService
from app.profiles.schemas import JobSeekerUpdate, CompanyUpdate

class EventConsumer:
    @staticmethod
    async def start_consuming():
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
                        async with AsyncSessionLocal() as session:
                            if role in ("worker", "seeker"):
                                await ProfileService.update_my_seeker_profile(session, user_id, JobSeekerUpdate())
                            elif role == "employer":
                                await ProfileService.update_my_company_profile(session, user_id, CompanyUpdate(company_name=f"Company_{user_id}"))
                except Exception as e:
                    print(f" [!] Ошибка Consumer: {e}")

        async def process_delete_message(message: aio_pika.abc.AbstractIncomingMessage):
            async with message.process():
                try:
                    data = json.loads(message.body.decode())
                    if user_id := data.get("user_id"):
                        async with AsyncSessionLocal() as session:
                            await ProfileService.delete_user_profiles(session, user_id)
                except Exception as e:
                    print(f" [!] Ошибка Delete Consumer: {e}")

        async def process_application_message(message: aio_pika.abc.AbstractIncomingMessage):
            async with message.process():
                try:
                    data = json.loads(message.body.decode())
                    async with AsyncSessionLocal() as session:
                        await ProfileService.handle_application_event(session, data)
                except Exception as e:
                    print(f" [!] Ошибка Application Consumer: {e}")

        await user_queue.consume(process_user_message)
        await delete_queue.consume(process_delete_message)
        await app_queue.consume(process_application_message)

        print(" [*] Profile Worker started...")
        await asyncio.Future()