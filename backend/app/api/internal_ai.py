"""
PrepPulse Internal AI Microservice Endpoints
Exposes structured AI question generation, single answer evaluation, and whole interview debrief
strictly to the Node.js application backend protected by service-to-service authentication.
"""
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Header, HTTPException, status
from pydantic import BaseModel, Field

from app.core.config import settings
from app.core.logging import logger
from app.ai.question_generator import generate_questions_for_interview
from app.services.groq_evaluation_service import groq_evaluation_service

router = APIRouter(prefix="/internal/ai", tags=["Internal AI Service"])


def verify_internal_secret(x_internal_secret: Optional[str] = Header(None, alias="X-Internal-Secret")):
    expected = settings.INTERNAL_SERVICE_SECRET
    if not expected:
        return
    if not x_internal_secret or x_internal_secret != expected:
        logger.warning("Unauthorized internal AI service access attempt.")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Invalid or missing X-Internal-Secret header."
        )


class GenerateQuestionsRequest(BaseModel):
    job_role: str
    round_type: str = "technical"
    difficulty: str = "mid"
    topics: List[str]
    total_questions: int = Field(default=5, ge=1, le=10)


class EvaluateAnswerRequest(BaseModel):
    question: Dict[str, Any]
    candidate_answer: str
    job_role: str = "Senior Software Engineer"
    difficulty: str = "mid"
    round_type: str = "technical"


class WholeDebriefRequest(BaseModel):
    interview: Dict[str, Any]
    transcript: List[Dict[str, Any]]


@router.get("/health")
async def internal_health():
    """Health check for Python AI microservice."""
    return {
        "status": "healthy",
        "service": "preppulse-python-ai-microservice",
        "model": settings.GROQ_MODEL,
        "groq_configured": bool(settings.GROQ_API_KEY)
    }


@router.post("/generate-questions")
async def internal_generate_questions(
    req: GenerateQuestionsRequest,
    x_internal_secret: Optional[str] = Header(None, alias="X-Internal-Secret")
):
    verify_internal_secret(x_internal_secret)
    questions = await generate_questions_for_interview(
        job_role=req.job_role,
        round_type=req.round_type,
        difficulty=req.difficulty,
        selected_topics=req.topics,
        total_questions=req.total_questions
    )
    return {"questions": questions, "count": len(questions)}


@router.post("/evaluate-answer")
async def internal_evaluate_answer(
    req: EvaluateAnswerRequest,
    x_internal_secret: Optional[str] = Header(None, alias="X-Internal-Secret")
):
    verify_internal_secret(x_internal_secret)
    result = await groq_evaluation_service.evaluate_answer(
        question=req.question,
        answer_text=req.candidate_answer,
        job_role=req.job_role,
        difficulty=req.difficulty,
        round_type=req.round_type
    )
    return result


@router.post("/whole-debrief")
async def internal_whole_debrief(
    req: WholeDebriefRequest,
    x_internal_secret: Optional[str] = Header(None, alias="X-Internal-Secret")
):
    verify_internal_secret(x_internal_secret)
    result = await groq_evaluation_service.evaluate_whole_interview_transcript(
        interview=req.interview,
        transcript=req.transcript
    )
    return result
