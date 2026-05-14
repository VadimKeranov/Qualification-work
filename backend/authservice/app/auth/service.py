import datetime
from jose import jwt
from fastapi import HTTPException

from jose import jwt
from jose.exceptions import JWTError, ExpiredSignatureError

from sqlalchemy.ext.asyncio import AsyncSession
from app.auth.repository import UserRepository
from app.utils.password import hash_password, verify_password
from app.utils.jwt import create_access_token
from app.db.models import User
from app.core.messaging import EventProducer  # <--- Новый импорт
from app.config import settings

class AuthService:

    @staticmethod
    async def register(session: AsyncSession, email: str, password: str, role: str):
        existing_user = await UserRepository.get_by_email(session, email)
        if existing_user:
            return None

        hashed_pwd = hash_password(password)

        new_user = User(email=email, password_hash=hashed_pwd, role=role, is_active=False)
        created_user = await UserRepository.create(session, new_user)

        expire = datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        to_encode = {"sub": str(created_user.id), "type": "email_verification", "exp": expire}
        verification_token = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

        await EventProducer.publish_email_verification(created_user.email, verification_token)
        return created_user

    @staticmethod
    async def verify_email(session: AsyncSession, token: str):
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            user_id_str: str = payload.get("sub")
            token_type = payload.get("type")

            if token_type != "email_verification" or not user_id_str:
                return False

            user_id = int(user_id_str)

            user = await UserRepository.get_by_id(session, user_id)

            if not user or user.is_active:
                return False

            user.is_active = True
            await session.commit()

            await EventProducer.publish_user_created(user.id, user.role)

            return True

        except (JWTError, ValueError):
            return False

    @staticmethod
    async def resend_verification(session: AsyncSession, email: str):
        user = await UserRepository.get_by_email(session, email)

        if not user:
            return False, "Користувача не знайдено."
        if user.is_active:
            return False, "Електронна пошта вже підтверджена."

        # Генеруємо новий токен
        expire = datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        to_encode = {"sub": str(user.id), "type": "email_verification", "exp": expire}
        verification_token = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

        # Відправляємо в RabbitMQ
        await EventProducer.publish_email_verification(user.email, verification_token)

        return True, "Лист для підтвердження відправлено повторно."


    @staticmethod
    async def login(session: AsyncSession, email: str, password: str):
        user = await UserRepository.get_by_email(session, email)

        if not user or not verify_password(password, user.password_hash):
            return None

        if not user.is_active:
            raise HTTPException(
                status_code=403,
                detail="Будь ласка, підтвердіть вашу електронну пошту. Лист відправлено на вказану адресу."
            )

        return create_access_token(data={"sub": str(user.id), "role": user.role})
