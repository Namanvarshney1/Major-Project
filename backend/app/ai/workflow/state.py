"""
LangGraph Interview Workflow Typed State
Maintains strictly the state variables required across workflow transitions.
"""
from typing import List, Optional, Dict, Any, TypedDict


class InterviewState(TypedDict, total=False):
    interview_id: str
    user_id: str
    job_role: str
    difficulty: str
    interview_type: str
    selected_topics: List[str]
    total_questions: int
    current_question_index: int
    current_topic: str
    
    # Active question data
    current_question: Optional[Dict[str, Any]]
    
    # Candidate answer payload
    candidate_answer: Optional[str]
    time_spent_seconds: Optional[int]
    
    # Evaluation result
    current_evaluation: Optional[Dict[str, Any]]
    
    # Workflow control
    action_type: str  # "generate_question" | "evaluate_answer"
    is_valid: bool
    next_action: str  # "wait_for_answer" | "generate_next" | "finalize"
    final_report: Optional[Dict[str, Any]]
    session_completed: Optional[bool]
    xp_awarded: Optional[int]
    is_persisted: Optional[bool]
    error: Optional[str]
