"""
LangGraph Conditional Routing Logic
Determines dynamic state transitions across interview workflow branches.
"""
from typing import Literal
from app.ai.workflow.state import InterviewState


def route_interview_action(state: InterviewState) -> Literal["load_relevant_context", "evaluate_answer", "__end__"]:
    """Routes based on whether this step is question generation or answer evaluation."""
    if not state.get("is_valid", False):
        return "__end__"
    
    action = state.get("action_type", "generate_question")
    if action == "generate_question":
        return "load_relevant_context"
    elif action == "evaluate_answer":
        return "evaluate_answer"
    return "__end__"


def route_post_evaluation(state: InterviewState) -> Literal["generate_final_report", "__end__"]:
    """Routes between session finalization or pausing for the next question."""
    next_action = state.get("next_action")
    if next_action == "finalize":
        return "generate_final_report"
    return "__end__"
