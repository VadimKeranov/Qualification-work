import logging
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.core.dependencies import require_admin, get_db
from app.admin.service import AdminService
from app.auth.schemas import UserResponse

router = APIRouter(prefix="/admin/users", tags=["Admin"])
logger = logging.getLogger(__name__)

class UserCreateByAdmin(BaseModel):
    email: str
    password: str
    role: str

class UserUpdateRole(BaseModel):
    role: str

@router.get("/", response_model=List[UserResponse])
async def get_users(
    payload: dict = Depends(require_admin),
    session: AsyncSession = Depends(get_db)
):
    admin_id = payload.get("sub", "Unknown")
    logger.info(f"API Request: Admin (ID: {admin_id}) requested the users list.")
    return await AdminService.get_all_users(session)

@router.post("/")
async def create_user(
    data: UserCreateByAdmin,
    payload: dict = Depends(require_admin),
    session: AsyncSession = Depends(get_db)
):
    admin_id = payload.get("sub", "Unknown")
    logger.info(f"API Request: Admin (ID: {admin_id}) creating a new user ({data.email}).")
    user = await AdminService.create_user_and_notify(session, data.email, data.password, data.role)
    return {"status": "User created successfully", "user_id": user.id}

@router.patch("/{user_id}/role")
async def change_user_role(
    user_id: int,
    data: UserUpdateRole,
    payload: dict = Depends(require_admin),
    session: AsyncSession = Depends(get_db)
):
    admin_id = payload.get("sub", "Unknown")
    logger.info(f"API Request: Admin (ID: {admin_id}) changing role of user ID {user_id} to '{data.role}'.")
    await AdminService.update_user_role(session, user_id, data.role)
    return {"status": f"User role updated to {data.role}"}

@router.delete("/{user_id}")
async def remove_user(
    user_id: int,
    payload: dict = Depends(require_admin),
    session: AsyncSession = Depends(get_db)
):
    admin_id = payload.get("sub", "Unknown")
    logger.info(f"API Request: Admin (ID: {admin_id}) deleting user ID {user_id}.")
    await AdminService.delete_user_and_notify(session, user_id)
    return {"status": "User deleted and all services notified"}