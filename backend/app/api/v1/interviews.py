"""
Interview Lifecycle API Endpoints
"""
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, status, Body
from app.db.mongodb import get_db
from app.api.dependencies import get_current_user
from app.services.interview_service import InterviewService
from app.schemas.interview import InterviewCreate, InterviewResponse, AnswerSubmit

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


@router.post("/{interview_id}/questions/{question_id}/save", response_model=Dict[str, Any])
async def save_interview_answer(
    interview_id: str,
    question_id: str,
    answer_payload: AnswerSubmit,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db=Depends(get_db)
):
    service = InterviewService(db)
    return await service.save_answer(
        interview_id=interview_id,
        question_id=question_id,
        user_id=current_user["id"],
        answer_text=answer_payload.answer_text,
        time_spent_seconds=answer_payload.time_spent_seconds or 0
    )


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
