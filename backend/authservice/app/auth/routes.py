from fastapi import APIRouter, HTTPException, Depends
from app.auth.schemas import RegisterRequest, LoginRequest, UserResponse
from app.auth.service import AuthService
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.dependencies import get_db, get_current_user
from app.db.models import User

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
    data: LoginRequest,
    session: AsyncSession = Depends(get_db)
):
    token = await AuthService.login(session, data.email, data.password)
    if not token:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"access_token": token}


@router.get("/me", response_model=UserResponse)
async def read_user_me(current_user: User = Depends(get_current_user)):
    return current_user
