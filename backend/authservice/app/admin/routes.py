from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

# Правильные импорты
from app.core.dependencies import require_admin, get_db
from app.admin.service import AdminService
from app.auth.schemas import UserResponse

router = APIRouter(prefix="/admin/users", tags=["Admin"])

class UserCreateByAdmin(BaseModel):
    email: str
    password: str
    role: str

class UserUpdateRole(BaseModel):
    role: str

# ДОБАВЛЕН response_model=List[UserResponse] - без него данные не уйдут во фронтенд!
@router.get("/", response_model=List[UserResponse])
async def get_users(
    payload: dict = Depends(require_admin),
    session: AsyncSession = Depends(get_db)
):
    return await AdminService.get_all_users(session)

@router.post("/")
async def create_user(
    data: UserCreateByAdmin,
    payload: dict = Depends(require_admin),
    session: AsyncSession = Depends(get_db)
):
    user = await AdminService.create_user_and_notify(session, data.email, data.password, data.role)
    return {"status": "User created successfully", "user_id": user.id}

@router.patch("/{user_id}/role")
async def change_user_role(
    user_id: int,
    data: UserUpdateRole,
    payload: dict = Depends(require_admin),
    session: AsyncSession = Depends(get_db)
):
    await AdminService.update_user_role(session, user_id, data.role)
    return {"status": f"User role updated to {data.role}"}

@router.delete("/{user_id}")
async def remove_user(
    user_id: int,
    payload: dict = Depends(require_admin),
    session: AsyncSession = Depends(get_db)
):
    await AdminService.delete_user_and_notify(session, user_id)
    return {"status": "User deleted and all services notified"}