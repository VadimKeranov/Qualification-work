from sqlalchemy.ext.asyncio import AsyncSession
from app.auth.repository import UserRepository
from app.utils.password import hash_password, verify_password
from app.utils.jwt import create_access_token
from app.db.models import User
from app.core.messaging import EventProducer  # <--- Новый импорт

class AuthService:

    @staticmethod
    async def register(session: AsyncSession, email: str, password: str, role: str):
        # 1. Проверяем, существует ли пользователь
        existing_user = await UserRepository.get_by_email(session, email)
        if existing_user:
            return None

        # 2. Хешируем пароль и создаем пользователя в БД
        hashed_pwd = hash_password(password)
        new_user = User(email=email, password_hash=hashed_pwd, role=role)
        created_user = await UserRepository.create(session, new_user)

        # 3. Публикуем событие о создании пользователя.
        #    Вся сложность работы с RabbitMQ теперь скрыта в EventProducer.
        await EventProducer.publish_user_created(created_user.id, created_user.role)

        return created_user

    @staticmethod
    async def login(session: AsyncSession, email: str, password: str):
        user = await UserRepository.get_by_email(session, email)

        if not user or not verify_password(password, user.password_hash):
            return None

        return create_access_token({
            "sub": user.email,
            "id": user.id,
            "role": user.role
        })
