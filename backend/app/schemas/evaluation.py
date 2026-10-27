"""
Evaluation and Final Report Pydantic Schemas
"""
from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class EvaluationResponse(BaseModel):
    id: str
    interview_id: str
    question_id: str
    question_text: Optional[str] = None
    topic: Optional[str] = None
    technical_accuracy: float = Field(..., ge=0, le=100)
    relevance: float = Field(..., ge=0, le=100)
    completeness: float = Field(..., ge=0, le=100)
    clarity: float = Field(..., ge=0, le=100)
    overall_score: float = Field(..., ge=0, le=100)
    strengths: List[str]
    missing_concepts: List[str]
    feedback: str
    model_answer: str
    model_identifier: str
    created_at: datetime


class InterviewReportResponse(BaseModel):
    interview_id: str
    user_id: str
    job_role: str
    interview_type: str
    difficulty: str
    status: str
    overall_score: float
    total_questions: int
    answered_questions: int
    strongest_topics: List[str]
    weakest_topics: List[str]
    recommendations: List[str]
    suggested_next_session: Dict[str, Any]
    evaluations: List[EvaluationResponse]
    xp_earned: int
    completed_at: Optional[datetime] = None
