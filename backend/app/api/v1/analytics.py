"""
Interview DNA & Skill Tree API Endpoints
"""
from typing import Dict, Any
from fastapi import APIRouter, Depends
from app.db.mongodb import get_db
from app.api.dependencies import get_current_user
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["Analytics & DNA"])


@router.get("/dna", response_model=Dict[str, Any])
async def get_interview_dna(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db=Depends(get_db)
):
    service = AnalyticsService(db)
    return await service.get_interview_dna(current_user["id"])


@router.get("/skill-tree", response_model=Dict[str, Any])
async def get_skill_tree(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db=Depends(get_db)
):
    service = AnalyticsService(db)
    return await service.get_skill_tree(current_user["id"])
