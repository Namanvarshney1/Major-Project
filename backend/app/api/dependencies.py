"""
FastAPI Route Dependencies
Extracts and validates JWT Bearer tokens, providing strongly typed candidate identity.
"""
from typing import Optional, Dict, Any
import jwt
from fastapi import Depends, Header

from app.core.config import settings
from app.core.errors import UnauthorizedException
from app.core.logging import logger
from app.db.mongodb import get_db
from app.repositories.user_repository import UserRepository


async def get_current_user(
    authorization: Optional[str] = Header(None),
    db=Depends(get_db)
) -> Dict[str, Any]:
    """Authenticates request via Bearer token, returning the validated user document."""
    if not authorization or not authorization.strip():
        raise UnauthorizedException(detail="Missing Authorization header")

    parts = authorization.strip().split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise UnauthorizedException(detail="Malformed Authorization header. Format must be 'Bearer <token>'")

    token = parts[1]

    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM]
        )
    except jwt.ExpiredSignatureError:
        raise UnauthorizedException(detail="Access token has expired. Please log in again.")
    except jwt.PyJWTError:
        raise UnauthorizedException(detail="Invalid access token signature or format.")
    except Exception as exc:
        logger.debug(f"Token validation failed: {exc}")
        raise UnauthorizedException(detail="Could not validate authentication credentials.")

    user_id = payload.get("sub")
    if not user_id:
        raise UnauthorizedException(detail="Invalid token payload: missing subject identifier.")

    user_repo = UserRepository(db)
    user = await user_repo.get_by_id(user_id)
    if not user:
        raise UnauthorizedException(detail="User account no longer exists.")

    return user
