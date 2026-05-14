from jose import jwt, JWTError  # <--- Обязательный импорт
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="http://localhost:8001/auth/login")

def get_current_user_payload(token: str = Depends(oauth2_scheme)):
    try:
        # Декодируем токен с помощью python-jose
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )

        # Проверка наличия ID в токене
        user_id = payload.get("id") or payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Токен не містить ідентифікатор користувача",
            )
        return payload

    except JWTError:  # Перехватываем исключение именно от python-jose
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Недійсний токен або помилка підпису", # Лучше отдавать фронту понятный текст
        )