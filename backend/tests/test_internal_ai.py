"""
Tests for Python Internal AI Microservice Endpoints
Verifies service-to-service authentication and AI generation/evaluation contracts.
"""
import pytest
from app.core.config import settings


@pytest.mark.asyncio
async def test_internal_ai_requires_auth(client):
    # Without header
    res = await client.post("/internal/ai/generate-questions", json={
        "job_role": "Backend Engineer",
        "round_type": "technical",
        "difficulty": "mid",
        "topics": ["Databases"],
        "total_questions": 3
    })
    assert res.status_code == 403

    # With invalid header
    res = await client.post(
        "/internal/ai/generate-questions",
        json={
            "job_role": "Backend Engineer",
            "round_type": "technical",
            "difficulty": "mid",
            "topics": ["Databases"],
            "total_questions": 3
        },
        headers={"X-Internal-Secret": "invalid-secret"}
    )
    assert res.status_code == 403


@pytest.mark.asyncio
async def test_internal_ai_generate_questions_authorized(client):
    res = await client.post(
        "/internal/ai/generate-questions",
        json={
            "job_role": "Senior Backend Engineer",
            "round_type": "technical",
            "difficulty": "senior",
            "topics": ["Concurrency & Locks", "JVM Internals"],
            "total_questions": 3
        },
        headers={"X-Internal-Secret": settings.INTERNAL_SERVICE_SECRET}
    )
    assert res.status_code == 200
    data = res.json()
    assert "questions" in data
    assert len(data["questions"]) == 3
    q1 = data["questions"][0]
    assert "question_text" in q1
    assert "expected_concepts" in q1
    assert "evaluation_rubric" in q1
    assert q1["order"] == 1


@pytest.mark.asyncio
async def test_internal_ai_evaluate_answer_authorized(client):
    question = {
        "order": 1,
        "topic": "Concurrency",
        "question_text": "Explain synchronous vs asynchronous programming in Java.",
        "difficulty": "senior",
        "expected_concepts": ["Blocking thread stack", "Event loop", "Virtual Threads"],
        "evaluation_rubric": "Look for thread stack overhead and non-blocking I/O."
    }
    candidate_answer = (
        "In synchronous execution, each request allocates an OS thread with ~1MB memory that blocks on I/O. "
        "In asynchronous execution with epoll, threads multiplex multiple connections without blocking. "
        "Java 21 introduces Virtual Threads that unmount from carrier threads during blocking operations."
    )

    res = await client.post(
        "/internal/ai/evaluate-answer",
        json={
            "question": question,
            "candidate_answer": candidate_answer,
            "job_role": "Senior Backend Engineer",
            "difficulty": "senior",
            "round_type": "technical"
        },
        headers={"X-Internal-Secret": settings.INTERNAL_SERVICE_SECRET}
    )
    assert res.status_code == 200
    data = res.json()
    assert "overall_score" in data
    assert 0 <= data["overall_score"] <= 100
    assert "technical_accuracy" in data
    assert "feedback" in data
    assert "strengths" in data
    assert "missing_concepts" in data


@pytest.mark.asyncio
async def test_internal_ai_health(client):
    res = await client.get("/internal/ai/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["service"] == "preppulse-python-ai-microservice"

