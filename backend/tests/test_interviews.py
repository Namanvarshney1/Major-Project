"""
Interview Management & Flow Unit Tests
"""
import pytest


@pytest.mark.asyncio
async def test_create_interview(client, user_token):
    headers = {"Authorization": f"Bearer {user_token}"}
    payload = {
        "job_role": "Senior Backend Engineer (Java & Distributed Systems)",
        "interview_type": "technical",
        "difficulty": "senior",
        "selected_topics": ["Concurrency & Locks", "JVM Internals"],
        "total_questions": 5,
        "timed_mode": True,
        "time_limit_mins": 10
    }
    response = await client.post("/api/v1/interviews/", json=payload, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert data["status"] == "in_progress"
    assert data["total_questions"] == 5
    assert data["current_question_index"] == 0
    assert "current_question" in data
    assert data["current_question"]["order"] == 1
    assert len(data["current_question"]["question_text"]) > 10


@pytest.mark.asyncio
async def test_get_active_interview(client, user_token):
    headers = {"Authorization": f"Bearer {user_token}"}
    create_res = await client.post(
        "/api/v1/interviews/",
        json={"total_questions": 3},
        headers=headers
    )
    assert create_res.status_code == 201
    interview_id = create_res.json()["id"]

    active_res = await client.get("/api/v1/interviews/active", headers=headers)
    assert active_res.status_code == 200
    active_data = active_res.json()
    assert active_data is not None
    assert active_data["id"] == interview_id


@pytest.mark.asyncio
async def test_skip_question(client, user_token):
    headers = {"Authorization": f"Bearer {user_token}"}
    create_res = await client.post(
        "/api/v1/interviews/",
        json={"total_questions": 3},
        headers=headers
    )
    interview_id = create_res.json()["id"]

    skip_res = await client.post(f"/api/v1/interviews/{interview_id}/skip", headers=headers)
    assert skip_res.status_code == 200
    skip_data = skip_res.json()
    assert skip_data["current_question_index"] == 1
    assert skip_data["current_question"]["order"] == 2


@pytest.mark.asyncio
async def test_end_interview(client, user_token):
    headers = {"Authorization": f"Bearer {user_token}"}
    create_res = await client.post(
        "/api/v1/interviews/",
        json={"total_questions": 3},
        headers=headers
    )
    interview_id = create_res.json()["id"]

    end_res = await client.post(f"/api/v1/interviews/{interview_id}/end", headers=headers)
    assert end_res.status_code == 200
    end_data = end_res.json()
    assert end_data["status"] == "completed"
