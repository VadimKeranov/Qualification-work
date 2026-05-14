from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError, ExpiredSignatureError
from app.config import settings

# Простая проверка наличия Bearer токена в заголовке, без привязки к Swagger
security = HTTPBearer()


def get_current_user_payload(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    token = credentials.credentials
    try:
        # 1. Расшифровываем токен
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])

        user_id_str = payload.get("sub")
        role = payload.get("role")

        if not user_id_str:
            raise HTTPException(status_code=401, detail="У токені відсутній ідентифікатор користувача")

        # 3. Возвращаем словарь с ключом "id", чтобы старые роуты не сломались!
        return {"id": int(user_id_str), "role": role}

    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Токен прострочено")
    except JWTError:
        raise HTTPException(status_code=401, detail="Недійсний токен")