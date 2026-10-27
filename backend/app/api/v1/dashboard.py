"""
Dashboard Analytics API Endpoint
"""
from typing import Dict, Any
from fastapi import APIRouter, Depends
from app.db.mongodb import get_db
from app.api.dependencies import get_current_user
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/", response_model=Dict[str, Any])
async def get_dashboard(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db=Depends(get_db)
):
    service = DashboardService(db)
    return await service.get_dashboard_metrics(current_user["id"])
