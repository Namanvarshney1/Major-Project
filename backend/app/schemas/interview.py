"""
Interview Session Pydantic Schemas
"""
from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class InterviewCreate(BaseModel):
    job_role: str = Field(default="Senior Backend Engineer (Java & Distributed Systems)")
    interview_type: str = Field(default="technical", description="technical, behavioral, system_design, or hr")
    difficulty: str = Field(default="senior", description="junior, mid, senior, or staff")
    selected_topics: List[str] = Field(default_factory=lambda: ["Concurrency & Locks", "JVM Internals", "System Architecture"])
    total_questions: int = Field(default=5, ge=1, le=15)
    timed_mode: bool = Field(default=True)
    time_limit_mins: int = Field(default=10, ge=1, le=60)


class QuestionResponse(BaseModel):
    id: str
    interview_id: str
    question_text: str
    topic: str
    difficulty: str
    expected_concepts: List[str]
    order: int
    total_questions: int
    created_at: datetime


class AnswerSubmit(BaseModel):
    answer_text: str = Field(..., min_length=5, max_length=10000, description="Candidate's typed or dictated answer")
    time_spent_seconds: Optional[int] = Field(default=0, ge=0)


class InterviewResponse(BaseModel):
    id: str
    user_id: str
    job_role: str
    interview_type: str
    difficulty: str
    selected_topics: List[str]
    total_questions: int
    current_question_index: int
    status: str
    final_score: Optional[float] = None
    timed_mode: bool
    created_at: datetime
    completed_at: Optional[datetime] = None
    current_question: Optional[QuestionResponse] = None
