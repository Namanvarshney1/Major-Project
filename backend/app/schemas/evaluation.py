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
    candidate_answer: Optional[str] = None
    order: Optional[int] = 1
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


class QuestionFeedbackItem(BaseModel):
    question_id: str
    order: int
    question_text: str
    topic: str
    candidate_answer: str
    score: float
    technical_accuracy: float
    relevance: float
    completeness: float
    clarity: float
    what_went_well: List[str]
    what_was_missing: List[str]
    improvement_suggestion: str
    stronger_answer_example: str


class InterviewReportResponse(BaseModel):
    interview_id: str
    user_id: str
    job_role: str
    round_type: Optional[str] = "technical"
    interview_type: str
    difficulty: str
    status: str
    overall_score: float
    total_questions: int
    answered_questions: int
    performance_summary: Optional[str] = None
    score_explanation: Optional[str] = None
    round_specific_assessment: Optional[Dict[str, Any]] = None
    strongest_topics: List[str]
    weakest_topics: List[str]
    strengths: Optional[List[str]] = None
    areas_for_improvement: Optional[List[str]] = None
    recommendations: List[str]
    actionable_improvement_plan: Optional[Dict[str, Any]] = None
    readiness_assessment: Optional[Dict[str, Any]] = None
    suggested_next_session: Dict[str, Any]
    evaluations: List[EvaluationResponse]
    detailed_questions: Optional[List[QuestionFeedbackItem]] = None
    xp_earned: int
    completed_at: Optional[datetime] = None
