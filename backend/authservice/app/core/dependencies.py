from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession

# Импорты твоих модулей (обрати внимание на точки)
from app.db.session import engine, AsyncSessionLocal
from app.auth.repository import UserRepository
from app.utils.jwt import SECRET_KEY, ALGORITHM  # Берем настройки из твоего файла

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
        # 1. Декодируем токен
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        # В payload.get("sub") мы обычно кладем email (или id), посмотри как в create_access_token
        # Если в create_access_token ты клал {"sub": user.email}, то достаем email:
        email: str = payload.get("sub")

        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    # 2. Ищем пользователя в БД
    # Если метода get_by_email еще нет в репозитории, нужно добавить (см. ниже)
    user = await UserRepository.get_by_email(session, email)

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