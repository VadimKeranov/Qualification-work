from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession


# Импорты твоих модулей (обрати внимание на точки)
from app.db.session import engine, AsyncSessionLocal
from app.auth.repository import UserRepository
from app.config import settings

from app.db.models import User

# Эта строка сообщает Swagger UI, что токен нужно искать в ответе /auth/login
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


# Получение сессии БД (как dependency)
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session


async def get_current_user(
        token: str = Depends(oauth2_scheme),
        session: AsyncSession = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # 1. Декодуємо токен
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])

        # Дістаємо ID користувача (тепер це user_id, а не email!)
        user_id_str: str = payload.get("sub")

        if user_id_str is None:
            raise credentials_exception

        user_id = int(user_id_str)  # Перетворюємо на число

    except (JWTError, ValueError):
        raise credentials_exception

    # 2. Шукаємо користувача в БД за ID за допомогою твого нового методу
    user = await UserRepository.get_by_id(session, user_id)

    if user is None:
        raise credentials_exception

    return user

async def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough privileges"
        )
    return current_user