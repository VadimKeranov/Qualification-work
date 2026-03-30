from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError

# Використовуй той самий секретний ключ, що і в Auth Service
SECRET_KEY = "SUPER_SECRET_KEY"
ALGORITHM = "HS256"

security = HTTPBearer()

def get_current_user_payload(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")