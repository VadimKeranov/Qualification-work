from sqlalchemy import select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models import User

class AdminRepository:
    @staticmethod
    async def get_all_users(session: AsyncSession):
        result = await session.execute(select(User))
        return result.scalars().all()

    @staticmethod
    async def create_user(session: AsyncSession, email: str, hashed_password: str, role: str, is_active: bool = True):
        new_user = User(email=email, password_hash=hashed_password, role=role, is_active=is_active)
        session.add(new_user)
        await session.flush()
        await session.commit()
        return new_user

    @staticmethod
    async def delete_user(session: AsyncSession, user_id: int):
        await session.execute(delete(User).where(User.id == user_id))
        await session.commit()

    @staticmethod
    async def update_user_role(session: AsyncSession, user_id: int, new_role: str):
        await session.execute(
            update(User).where(User.id == user_id).values(role=new_role)
        )
        await session.commit()

    @staticmethod
    async def activate_user(session: AsyncSession, user_id: int):
        await session.execute(update(User).where(User.id == user_id).values(is_active=True))
        await session.commit()