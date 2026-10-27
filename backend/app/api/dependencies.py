"""
FastAPI Route Dependencies
Extracts and validates JWT Bearer tokens, providing strongly typed candidate identity.
"""
from typing import Optional, Dict, Any
from fastapi import Depends, Header
from app.core.security import decode_access_token
from app.core.errors import UnauthorizedException
from app.db.mongodb import get_db
from app.repositories.user_repository import UserRepository


async def get_current_user(
    authorization: Optional[str] = Header(None),
    db=Depends(get_db)
) -> Dict[str, Any]:
    """Authenticates request via Bearer token, returning the validated user document."""
    if not authorization or not authorization.startswith("Bearer "):
        raise UnauthorizedException(detail="Missing or malformed Authorization header")

    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise UnauthorizedException(detail="Invalid or expired access token")

    user_id = payload["sub"]
    user_repo = UserRepository(db)
    user = await user_repo.get_by_id(user_id)
    if not user:
        raise UnauthorizedException(detail="User account no longer exists")

    return user
