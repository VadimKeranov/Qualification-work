from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm
from app.auth.schemas import RegisterRequest, LoginRequest, UserResponse
from app.auth.service import AuthService
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.dependencies import get_db, get_current_user
from app.db.models import User
from app.auth.schemas import ResendEmailRequest

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register")
async def register(
    data: RegisterRequest,
    session: AsyncSession = Depends(get_db)
):
    user = await AuthService.register(session, data.email, data.password, data.role)
    if not user:
        raise HTTPException(status_code=400, detail="User already exists")
    return {"id": user.id, "email": user.email}


@router.post("/login")
async def login(
        form_data: OAuth2PasswordRequestForm = Depends(),
        session: AsyncSession = Depends(get_db)
):
    token = await AuthService.login(session, form_data.username, form_data.password)
    if not token:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # OAuth2 требует возвращать тип токена
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
async def read_user_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("/verify/{token}")
async def verify_email(token: str, session: AsyncSession = Depends(get_db)):
    success = await AuthService.verify_email(session, token)
    if not success:
        raise HTTPException(status_code=400, detail="Токен недійсний або прострочений, або пошта вже підтверджена")

    return {"status": "success", "message": "Електронна пошта успішно підтверджена! Тепер ви можете увійти."}


@router.post("/resend-verification")
async def resend_verification_email(data: ResendEmailRequest, session: AsyncSession = Depends(get_db)):
    success, message = await AuthService.resend_verification(session, data.email)
    if not success:
        raise HTTPException(status_code=400, detail=message)

    return {"status": "success", "message": message}