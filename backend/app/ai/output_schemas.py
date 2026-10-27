"""
Structured Pydantic Schemas for AI Output Validation
Ensures strict schema conformance before any persistence in MongoDB.
"""
from typing import List
from pydantic import BaseModel, Field


class QuestionGenOutput(BaseModel):
    """Structured output expected from Question Generation LLM."""
    question_text: str = Field(..., description="High-signal, realistic interview question prompt")
    topic: str = Field(..., description="Specific subtopic name")
    difficulty: str = Field(..., description="junior, mid, senior, or staff")
    expected_concepts: List[str] = Field(..., min_length=2, description="Key concepts or trade-offs expected in answer")
    evaluation_rubric: str = Field(..., description="Concise guidelines for scoring the candidate response")


class AnswerEvalOutput(BaseModel):
    """Structured output expected from Answer Evaluation LLM."""
    technical_accuracy: float = Field(..., ge=0, le=100, description="Factual mechanics and engineering correctness")
    relevance: float = Field(..., ge=0, le=100, description="Alignment to problem asked without unnecessary tangent")
    completeness: float = Field(..., ge=0, le=100, description="Coverage of expected concepts and constraints")
    clarity: float = Field(..., ge=0, le=100, description="Structure, communication, and readability")
    overall_score: float = Field(..., ge=0, le=100, description="Weighted composite score out of 100")
    strengths: List[str] = Field(..., min_length=1, description="Explicit bullet points of what went well")
    missing_concepts: List[str] = Field(default_factory=list, description="Gaps, missing trade-offs or operational details")
    feedback: str = Field(..., description="Actionable coach synthesis and staff-level perspective")
    model_answer: str = Field(..., description="Benchmark staff-engineer standard model answer with code if applicable")
