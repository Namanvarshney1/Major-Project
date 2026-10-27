"""
LangGraph Workflow Unit Tests
Validates the 10-node state machine transitions and structured schemas.
"""
import pytest
from app.ai.workflow.graph import interview_workflow_app
from app.ai.output_schemas import QuestionGenOutput, AnswerEvalOutput


@pytest.mark.asyncio
async def test_workflow_question_generation():
    state = {
        "interview_id": "test_interview_123",
        "user_id": "test_user_456",
        "job_role": "Senior Backend Engineer",
        "difficulty": "senior",
        "interview_type": "technical",
        "selected_topics": ["Concurrency & Locks", "JVM Internals"],
        "total_questions": 5,
        "current_question_index": 0,
        "action_type": "generate_question"
    }

    result = await interview_workflow_app.ainvoke(state)
    assert result.get("is_valid") is True
    assert "current_question" in result
    q = result["current_question"]
    assert "question_text" in q
    assert len(q["question_text"]) > 10
    assert "expected_concepts" in q
    assert len(q["expected_concepts"]) >= 2
    assert q["order"] == 1


@pytest.mark.asyncio
async def test_workflow_answer_evaluation():
    state = {
        "interview_id": "test_interview_123",
        "user_id": "test_user_456",
        "job_role": "Senior Backend Engineer",
        "difficulty": "senior",
        "interview_type": "technical",
        "current_question_index": 0,
        "total_questions": 3,
        "current_question": {
            "question_text": "Explain synchronous vs asynchronous programming in Java.",
            "topic": "Concurrency",
            "expected_concepts": ["Blocking thread stack", "Event loop", "Virtual Threads"]
        },
        "candidate_answer": (
            "In synchronous models, threads block on I/O wasting ~1MB stack memory. "
            "In async programming with multiplexers (epoll), threads don't block. "
            "Java 21 Virtual Threads allow synchronous code that unmounts transparently."
        ),
        "action_type": "evaluate_answer"
    }

    result = await interview_workflow_app.ainvoke(state)
    assert "current_evaluation" in result
    eval_data = result["current_evaluation"]
    assert 0 <= eval_data["technical_accuracy"] <= 100
    assert 0 <= eval_data["overall_score"] <= 100
    assert len(eval_data["strengths"]) >= 1
    assert "feedback" in eval_data
    assert "model_answer" in eval_data
    assert result.get("next_action") == "generate_next"


@pytest.mark.asyncio
async def test_workflow_finalization_transition():
    # Last question in session (idx 2 out of 3)
    state = {
        "interview_id": "test_interview_123",
        "user_id": "test_user_456",
        "current_question_index": 2,
        "total_questions": 3,
        "current_question": {
            "question_text": "Describe B+ trees vs LSM trees.",
            "topic": "Databases"
        },
        "candidate_answer": "LSM trees optimize write throughput with append-only WAL and MemTables.",
        "action_type": "evaluate_answer"
    }

    result = await interview_workflow_app.ainvoke(state)
    assert result.get("next_action") == "finalize"
    assert "final_report" in result
    assert result.get("session_completed") is True
