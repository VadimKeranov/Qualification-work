from fastapi import Depends, HTTPException, status
from app.security import get_current_user_payload # Ваша текущая функция

def require_admin(payload: dict = Depends(get_current_user_payload)) -> dict:
    if payload.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Admin privileges required."
        )
    return payload