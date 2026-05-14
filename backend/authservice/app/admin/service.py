import datetime
from jose import jwt
from sqlalchemy.ext.asyncio import AsyncSession
from app.admin.repository import AdminRepository
from app.utils.password import hash_password
from app.core.messaging import EventProducer
from app.config import settings

class AdminService:
    @staticmethod
    async def get_all_users(session: AsyncSession):
        return await AdminRepository.get_all_users(session)

    @staticmethod
    async def create_user_and_notify(session: AsyncSession, email: str, password: str, role: str):
        hashed_pw = hash_password(password)

        # Если создаем админа — он изначально заблокирован
        is_active = False if role == "admin" else True
        new_user = await AdminRepository.create_user(session, email, hashed_pw, role, is_active)

        if role == "admin":
            # Токен на 24 часа
            expire = datetime.datetime.utcnow() + datetime.timedelta(hours=24)
            to_encode = {"sub": str(new_user.id), "type": "admin_approval", "exp": expire}
            approval_token = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

            await EventProducer.publish_admin_approval_required(new_user.email, approval_token)
        else:
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

    @staticmethod
    async def confirm_admin(session: AsyncSession, token: str):
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            if payload.get("type") != "admin_approval":
                return False
            user_id = int(payload.get("sub"))
            await AdminRepository.activate_user(session, user_id)
            return True
        except Exception:
            return False
