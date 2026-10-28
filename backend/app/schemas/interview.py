"""
Interview Session Pydantic Schemas
"""
from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class InterviewCreate(BaseModel):
    job_role: str = Field(default="Software Engineer")
    round_type: str = Field(default="technical", description="technical, hr, pi, or managerial")
    interview_type: Optional[str] = Field(default="technical", description="legacy compatibility")
    difficulty: str = Field(default="senior", description="junior, mid, senior, or staff")
    selected_topics: List[str] = Field(default_factory=lambda: ["Data Structures and Algorithms", "System Design"])
    total_questions: int = Field(default=10, ge=1, le=25)
    timed_mode: bool = Field(default=True)
    time_limit_mins: int = Field(default=10, ge=1, le=120)

    @classmethod
    def normalize_round(cls, v: Any) -> str:
        val = str(v or "technical").strip().lower()
        if val in ("technical", "hr", "pi", "managerial"):
            return val
        if val in ("personal", "personal interview"):
            return "pi"
        if val in ("hr & culture", "hr & culture fit"):
            return "hr"
        if val in ("managerial & leadership", "leadership"):
            return "managerial"
        return "technical"


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
    saved_answer: Optional[str] = None
    time_spent_seconds: Optional[int] = 0


class AnswerSubmit(BaseModel):
    answer_text: str = Field(default="", description="Candidate's typed or dictated answer")
    time_spent_seconds: Optional[int] = Field(default=0, ge=0)
    evaluate_immediate: Optional[bool] = Field(default=False, description="Whether to evaluate immediately for single question test")


class InterviewResponse(BaseModel):
    id: str
    user_id: str
    job_role: str
    round_type: Optional[str] = "technical"
    interview_type: str
    difficulty: str
    selected_topics: List[str]
    total_questions: int
    current_question_index: int
    status: str
    final_score: Optional[float] = None
    timed_mode: bool
    time_limit_mins: Optional[int] = 10
    created_at: datetime
    completed_at: Optional[datetime] = None
    current_question: Optional[QuestionResponse] = None
    questions: Optional[List[QuestionResponse]] = None
