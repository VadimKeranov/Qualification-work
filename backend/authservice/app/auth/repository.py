from sqlalchemy import select, delete
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models import User

class UserRepository:

    @staticmethod
    async def get_by_id(session: AsyncSession, user_id: int):
        result = await session.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_email(session: AsyncSession, email: str):
        # Мы используем сессию, которую передали снаружи (из dependencies.py)
        result = await session.execute(
            select(User).where(User.email == email)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def create(session: AsyncSession, user: User):
        # Здесь тоже принимаем session
        session.add(user)
        await session.commit()
        await session.refresh(user)
        return user

    @staticmethod
    async def delete_unverified_expired_users(session: AsyncSession, expire_minutes: int = 30):
        threshold_time = datetime.utcnow() - timedelta(minutes=expire_minutes)
        stmt = delete(User).where(User.is_active == False, User.created_at < threshold_time)
        await session.execute(stmt)
        await session.commit()