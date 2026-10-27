"""
Interview Lifecycle API Endpoints
"""
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, status
from app.db.mongodb import get_db
from app.api.dependencies import get_current_user
from app.services.interview_service import InterviewService
from app.schemas.interview import InterviewCreate, InterviewResponse

router = APIRouter(prefix="/interviews", tags=["Interviews"])


@router.post("/", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
async def create_interview(
    create_data: InterviewCreate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db=Depends(get_db)
):
    service = InterviewService(db)
    return await service.create_interview(current_user["id"], create_data)


@router.get("/active", response_model=Optional[Dict[str, Any]])
async def get_active_interview(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db=Depends(get_db)
):
    service = InterviewService(db)
    return await service.get_active_session(current_user["id"])


@router.get("/{interview_id}", response_model=Dict[str, Any])
async def get_interview_by_id(
    interview_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db=Depends(get_db)
):
    service = InterviewService(db)
    return await service.get_interview_session(interview_id, current_user["id"])


@router.post("/{interview_id}/skip", response_model=Dict[str, Any])
async def skip_interview_question(
    interview_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db=Depends(get_db)
):
    service = InterviewService(db)
    return await service.skip_question(interview_id, current_user["id"])


@router.post("/{interview_id}/end", response_model=Dict[str, Any])
async def end_interview_session(
    interview_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db=Depends(get_db)
):
    service = InterviewService(db)
    return await service.end_interview(interview_id, current_user["id"])
