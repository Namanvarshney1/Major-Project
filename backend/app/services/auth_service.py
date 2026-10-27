"""
Authentication Service
Handles candidate registration, Argon2id password verification, profile updates, and JWT issuance.
"""
from typing import Optional, Dict, Any
from app.core.security import hash_password, verify_password, create_access_token
from app.core.errors import UnauthorizedException, PrepPulseException
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserRegister, UserLogin, UserProfileUpdate


class AuthService:
    def __init__(self, db):
        self.user_repo = UserRepository(db)

    async def register_user(self, reg_data: UserRegister) -> Dict[str, Any]:
        """Registers a new candidate with Argon2id hashed credentials."""
        existing = await self.user_repo.get_by_email(reg_data.email)
        if existing:
            raise PrepPulseException(status_code=400, detail="An account with this email already exists")

        profile_dict = reg_data.profile.model_dump() if reg_data.profile else {
            "target_role": "Senior Backend Engineer (Java & Distributed Systems)",
            "target_level": "L5/Senior IC",
            "experience_years": 4,
            "primary_language": "Java"
        }

        user_dict = {
            "name": reg_data.name.strip(),
            "email": reg_data.email.lower().strip(),
            "password_hash": hash_password(reg_data.password),
            "profile": profile_dict,
            "preferences": {
                "theme": "light",
                "timed_mode_default": True,
                "sound_enabled": True
            }
        }
        user = await self.user_repo.create(user_dict)
        token = create_access_token({"sub": user["id"], "email": user["email"]})
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": user
        }

    async def login_user(self, login_data: UserLogin) -> Dict[str, Any]:
        """Validates credentials and issues an access token."""
        user = await self.user_repo.get_by_email(login_data.email)
        if not user or not verify_password(login_data.password, user.get("password_hash", "")):
            raise UnauthorizedException(detail="Invalid email or password")

        token = create_access_token({"sub": user["id"], "email": user["email"]})
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": user
        }

    async def get_current_user_profile(self, user_id: str) -> Dict[str, Any]:
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise UnauthorizedException(detail="User profile not found")
        return user

    async def update_user_profile(self, user_id: str, update_data: UserProfileUpdate) -> Dict[str, Any]:
        data_to_update = {}
        if update_data.name:
            data_to_update["name"] = update_data.name.strip()
        if update_data.profile:
            data_to_update["profile"] = update_data.profile.model_dump()
        if update_data.preferences:
            data_to_update["preferences"] = update_data.preferences.model_dump()

        user = await self.user_repo.update(user_id, data_to_update)
        if not user:
            raise UnauthorizedException(detail="User not found")
        return user

    async def delete_user_account(self, user_id: str) -> bool:
        """Purges user data upon account deletion request."""
        return await self.user_repo.delete(user_id)
