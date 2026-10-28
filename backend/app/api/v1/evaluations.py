"""
Evaluation & Report API Endpoints
"""
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, status
from app.db.mongodb import get_db
from app.api.dependencies import get_current_user
from app.services.evaluation_service import EvaluationService
from app.schemas.interview import AnswerSubmit
from app.schemas.evaluation import EvaluationResponse, InterviewReportResponse

router = APIRouter(tags=["Evaluations & Reports"])


@router.post("/interviews/{interview_id}/questions/{question_id}/answer", response_model=Dict[str, Any])
async def submit_answer(
    interview_id: str,
    question_id: str,
    answer_payload: AnswerSubmit,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db=Depends(get_db)
):
    """Submits candidate answer for a question and returns evaluation summary."""
    service = EvaluationService(db)
    return await service.submit_and_evaluate_answer(
        interview_id=interview_id,
        question_id=question_id,
        user_id=current_user["id"],
        answer_text=answer_payload.answer_text,
        time_spent_seconds=answer_payload.time_spent_seconds or 0,
        evaluate_immediate=answer_payload.evaluate_immediate or False
    )


@router.post("/interviews/{interview_id}/complete-evaluation", response_model=Dict[str, Any])
async def complete_interview_evaluation(
    interview_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db=Depends(get_db)
):
    """Triggers whole-interview evaluation across all submitted questions."""
    service = EvaluationService(db)
    return await service.evaluate_complete_session(interview_id, current_user["id"])


@router.post("/interviews/{interview_id}/retry-evaluation", response_model=Dict[str, Any])
async def retry_interview_evaluation(
    interview_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db=Depends(get_db)
):
    """Re-runs whole-interview evaluation on existing transcript if needed."""
    service = EvaluationService(db)
    return await service.retry_evaluation(interview_id, current_user["id"])


@router.get("/interviews/{interview_id}/questions/{question_id}/evaluation", response_model=Optional[Dict[str, Any]])
async def get_question_evaluation(
    interview_id: str,
    question_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db=Depends(get_db)
):
    service = EvaluationService(db)
    return await service.get_evaluation_for_question(question_id, current_user["id"])


@router.get("/interviews/{interview_id}/report", response_model=Dict[str, Any])
async def get_interview_report(
    interview_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db=Depends(get_db)
):
    service = EvaluationService(db)
    return await service.get_final_report(interview_id, current_user["id"])
