from sqlalchemy.ext.asyncio import AsyncSession
from app.admin.repository import AdminRepository
from app.utils.password import hash_password
from app.core.messaging import EventProducer  # <--- Новый импорт

class AdminService:
    @staticmethod
    async def get_all_users(session: AsyncSession):
        return await AdminRepository.get_all_users(session)

    @staticmethod
    async def create_user_and_notify(session: AsyncSession, email: str, password: str, role: str):
        hashed_pw = hash_password(password)
        new_user = await AdminRepository.create_user(session, email, hashed_pw, role)

        # Используем тот же самый EventProducer
        await EventProducer.publish_user_created(new_user.id, new_user.role)

        return new_user

    @staticmethod
    async def update_user_role(session: AsyncSession, user_id: int, new_role: str):
        # Здесь пока нет событий, но если они понадобятся, их легко будет добавить
        await AdminRepository.update_user_role(session, user_id, new_role)

    @staticmethod
    async def delete_user_and_notify(session: AsyncSession, user_id: int):
        await AdminRepository.delete_user(session, user_id)

        # Используем EventProducer для события удаления
        await EventProducer.publish_user_deleted(user_id)
