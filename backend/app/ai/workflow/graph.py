"""
LangGraph Workflow Assembly and Compilation
Constructs the stateful interview graph with typed state and conditional routing.
"""
from langgraph.graph import StateGraph, START, END

from app.ai.workflow.state import InterviewState
from app.ai.workflow.nodes import (
    validate_interview,
    load_relevant_context,
    generate_question,
    validate_question,
    evaluate_answer,
    validate_evaluation,
    persist_evaluation,
    select_next_action,
    generate_final_report,
    finalize_session,
)
from app.ai.workflow.routing import (
    route_interview_action,
    route_post_evaluation,
)


def create_interview_workflow():
    """Builds and compiles the 10-node stateful interview workflow."""
    workflow = StateGraph(InterviewState)

    # Register all 10 nodes
    workflow.add_node("validate_interview", validate_interview)
    workflow.add_node("load_relevant_context", load_relevant_context)
    workflow.add_node("generate_question", generate_question)
    workflow.add_node("validate_question", validate_question)
    workflow.add_node("evaluate_answer", evaluate_answer)
    workflow.add_node("validate_evaluation", validate_evaluation)
    workflow.add_node("persist_evaluation", persist_evaluation)
    workflow.add_node("select_next_action", select_next_action)
    workflow.add_node("generate_final_report", generate_final_report)
    workflow.add_node("finalize_session", finalize_session)

    # Initial entrypoint
    workflow.add_edge(START, "validate_interview")

    # Conditional branch from validation
    workflow.add_conditional_edges(
        "validate_interview",
        route_interview_action,
        {
            "load_relevant_context": "load_relevant_context",
            "evaluate_answer": "evaluate_answer",
            "__end__": END
        }
    )

    # Branch A: Question Generation pipeline
    workflow.add_edge("load_relevant_context", "generate_question")
    workflow.add_edge("generate_question", "validate_question")
    workflow.add_edge("validate_question", END)

    # Branch B: Answer Evaluation pipeline
    workflow.add_edge("evaluate_answer", "validate_evaluation")
    workflow.add_edge("validate_evaluation", "persist_evaluation")
    workflow.add_edge("persist_evaluation", "select_next_action")

    # Conditional branch from evaluation completion
    workflow.add_conditional_edges(
        "select_next_action",
        route_post_evaluation,
        {
            "generate_final_report": "generate_final_report",
            "__end__": END
        }
    )

    workflow.add_edge("generate_final_report", "finalize_session")
    workflow.add_edge("finalize_session", END)

    return workflow.compile()


interview_workflow_app = create_interview_workflow()
