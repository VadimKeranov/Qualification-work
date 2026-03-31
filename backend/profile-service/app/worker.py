import asyncio
import json
import aio_pika
from app.db.session import AsyncSessionLocal
from app.profile_repository import ProfileRepository
from app.schemas.profile import JobSeekerUpdate, CompanyUpdate

# 1. ОБРАБОТКА СОЗДАНИЯ (Обновлено)
async def process_user_created(message: aio_pika.IncomingMessage):
    async with message.process():
        data = json.loads(message.body.decode())
        user_id = data.get("id")
        role = data.get("role")

        async with AsyncSessionLocal() as session:
            if role == "worker":
                empty_data = JobSeekerUpdate(first_name="", last_name="")
                await ProfileRepository.upsert_seeker(session, user_id, empty_data)
                print(f" [+] Профиль соискателя создан для user_id: {user_id}")
            elif role == "employer":
                empty_data = CompanyUpdate(company_name="")
                await ProfileRepository.upsert_company(session, user_id, empty_data)
                print(f" [+] Профиль компании создан для user_id: {user_id}")
            elif role == "admin":
                # Админу не нужен профиль, просто логируем
                print(f" [*] Admin created (ID: {user_id}), skipping profile creation.")

# 2. ОБРАБОТКА УДАЛЕНИЯ (Новая функция для действий админа)
async def process_user_deleted(message: aio_pika.IncomingMessage):
    async with message.process():
        data = json.loads(message.body.decode())
        user_id = data.get("user_id")

        async with AsyncSessionLocal() as session:
            print(f" [*] Received delete command for user_id: {user_id}")
            # Вызов метода репозитория для зачистки базы
            await ProfileRepository.delete_profiles_by_user_id(session, user_id)

async def main():
    connection = await aio_pika.connect_robust("amqp://guest:guest@localhost/?heartbeat=0")
    channel = await connection.channel()

    # Очередь создания юзеров
    queue_created = await channel.declare_queue("user_created_queue", durable=True)
    await queue_created.consume(process_user_created)

    # Очередь удаления юзеров (Слушаем команды от админа)
    queue_deleted = await channel.declare_queue("user_deleted_queue", durable=True)
    await queue_deleted.consume(process_user_deleted)

    print(" [*] Profile Worker started. Waiting for messages...")
    await asyncio.Future()

if __name__ == "__main__":
    asyncio.run(main())