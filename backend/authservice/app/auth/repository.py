from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models import User

class UserRepository:

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