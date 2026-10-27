"""
Authentication & Candidate Profile API Endpoints
"""
from typing import Dict, Any
from fastapi import APIRouter, Depends, status
from app.db.mongodb import get_db
from app.api.dependencies import get_current_user
from app.services.auth_service import AuthService
from app.schemas.user import (
    UserRegister,
    UserLogin,
    UserResponse,
    TokenResponse,
    UserProfileUpdate
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(reg_data: UserRegister, db=Depends(get_db)):
    auth_service = AuthService(db)
    return await auth_service.register_user(reg_data)


@router.post("/login", response_model=TokenResponse)
async def login(login_data: UserLogin, db=Depends(get_db)):
    auth_service = AuthService(db)
    return await auth_service.login_user(login_data)


@router.get("/me", response_model=UserResponse)
async def get_profile(current_user: Dict[str, Any] = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_profile(
    update_data: UserProfileUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db=Depends(get_db)
):
    auth_service = AuthService(db)
    return await auth_service.update_user_profile(current_user["id"], update_data)


@router.delete("/me", status_code=status.HTTP_200_OK)
async def delete_account(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db=Depends(get_db)
):
    auth_service = AuthService(db)
    deleted = await auth_service.delete_user_account(current_user["id"])
    return {"success": deleted, "message": "Account successfully purged"}
