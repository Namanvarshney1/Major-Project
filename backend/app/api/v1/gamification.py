"""
Gamification & Achievements API Endpoints
"""
from typing import Dict, Any
from fastapi import APIRouter, Depends
from app.db.mongodb import get_db
from app.api.dependencies import get_current_user
from app.services.gamification_service import GamificationService

router = APIRouter(prefix="/gamification", tags=["Gamification"])


@router.get("/achievements", response_model=Dict[str, Any])
async def get_achievements(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db=Depends(get_db)
):
    service = GamificationService(db)
    return await service.get_achievements_overview(current_user["id"])
