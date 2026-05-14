import datetime
import logging
from jose import jwt
from sqlalchemy.ext.asyncio import AsyncSession
from app.admin.repository import AdminRepository
from app.utils.password import hash_password
from app.core.messaging import EventProducer
from app.config import settings

# Ініціалізація логера
logger = logging.getLogger(__name__)

class AdminService:
    @staticmethod
    async def get_all_users(session: AsyncSession):
        logger.info("Fetching all users from the database.")
        return await AdminRepository.get_all_users(session)

    @staticmethod
    async def create_user_and_notify(session: AsyncSession, email: str, password: str, role: str):
        logger.info(f"Attempting to create user: {email} with role: '{role}'")
        hashed_pw = hash_password(password)

        # Якщо створюємо адміна — він спочатку заблокований
        is_active = False if role == "admin" else True
        new_user = await AdminRepository.create_user(session, email, hashed_pw, role, is_active)

        if role == "admin":
            # Токен на 24 години
            expire = datetime.datetime.utcnow() + datetime.timedelta(hours=24)
            to_encode = {"sub": str(new_user.id), "type": "admin_approval", "exp": expire}
            approval_token = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

            await EventProducer.publish_admin_approval_required(new_user.email, approval_token)
            logger.info(f"Admin user {email} created (ID: {new_user.id}). Waiting for confirmation.")
        else:
            await EventProducer.publish_user_created(new_user.id, new_user.role)
            logger.info(f"User {email} created successfully (ID: {new_user.id}). Event published.")

        return new_user

    @staticmethod
    async def update_user_role(session: AsyncSession, user_id: int, new_role: str):
        logger.info(f"Updating role for user ID {user_id} to '{new_role}'.")
        await AdminRepository.update_user_role(session, user_id, new_role)
        logger.info(f"Role for user ID {user_id} successfully updated.")

    @staticmethod
    async def delete_user_and_notify(session: AsyncSession, user_id: int):
        logger.info(f"Initiating deletion for user ID {user_id}.")
        await AdminRepository.delete_user(session, user_id)

        # Використовуємо EventProducer для події видалення
        await EventProducer.publish_user_deleted(user_id)
        logger.info(f"User ID {user_id} successfully deleted. Deletion event published.")

    @staticmethod
    async def confirm_admin(session: AsyncSession, token: str):
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            if payload.get("type") != "admin_approval":
                logger.warning("Admin confirmation failed: Invalid token type.")
                return False
            user_id = int(payload.get("sub"))
            await AdminRepository.activate_user(session, user_id)
            logger.info(f"Admin account (ID: {user_id}) has been successfully confirmed and activated.")
            return True
        except Exception as e:
            logger.error(f"Admin confirmation failed due to token error: {str(e)}")
            return False