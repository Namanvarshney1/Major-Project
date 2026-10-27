"""
AI Coach Recommendations API Endpoint
"""
from typing import Dict, Any
from fastapi import APIRouter, Depends
from app.db.mongodb import get_db
from app.api.dependencies import get_current_user
from app.services.coach_service import CoachService

router = APIRouter(prefix="/coach", tags=["AI Coach"])


@router.get("/", response_model=Dict[str, Any])
async def get_coach_recommendation(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db=Depends(get_db)
):
    service = CoachService(db)
    return await service.get_coaching_recommendation(current_user["id"])
