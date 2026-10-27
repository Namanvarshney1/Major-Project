"""
Security and Multi-Tenant Isolation Unit Tests
Ensures zero cross-user data leakage and strict resource authorization.
"""
import pytest


@pytest.mark.asyncio
async def test_unauthenticated_request_rejected(client):
    response = await client.get("/api/v1/interviews/active")
    assert response.status_code == 401
    assert "authorization header" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_invalid_token_rejected(client):
    headers = {"Authorization": "Bearer completely-invalid-fake-jwt-token"}
    response = await client.get("/api/v1/auth/me", headers=headers)
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_cross_user_interview_access_forbidden(client, user_token, other_token):
    # Candidate Arjun creates an interview
    headers_arjun = {"Authorization": f"Bearer {user_token}"}
    create_res = await client.post(
        "/api/v1/interviews/",
        json={"total_questions": 3},
        headers=headers_arjun
    )
    assert create_res.status_code == 201
    interview_id = create_res.json()["id"]

    # Candidate Priya tries to read Arjun's interview
    headers_priya = {"Authorization": f"Bearer {other_token}"}
    read_res = await client.get(f"/api/v1/interviews/{interview_id}", headers=headers_priya)
    assert read_res.status_code == 403
    assert "access to this interview" in read_res.json()["detail"].lower()


@pytest.mark.asyncio
async def test_cross_user_answer_submission_forbidden(client, user_token, other_token):
    headers_arjun = {"Authorization": f"Bearer {user_token}"}
    create_res = await client.post(
        "/api/v1/interviews/",
        json={"total_questions": 3},
        headers=headers_arjun
    )
    interview_id = create_res.json()["id"]
    question_id = create_res.json()["current_question"]["id"]

    # Candidate Priya attempts to post an answer to Arjun's question
    headers_priya = {"Authorization": f"Bearer {other_token}"}
    answer_res = await client.post(
        f"/api/v1/interviews/{interview_id}/questions/{question_id}/answer",
        json={"answer_text": "Unauthorized answer injection attempt."},
        headers=headers_priya
    )
    assert answer_res.status_code == 403
    assert "own this interview" in answer_res.json()["detail"].lower()


@pytest.mark.asyncio
async def test_cross_user_report_access_forbidden(client, user_token, other_token):
    headers_arjun = {"Authorization": f"Bearer {user_token}"}
    create_res = await client.post(
        "/api/v1/interviews/",
        json={"total_questions": 1},
        headers=headers_arjun
    )
    interview_id = create_res.json()["id"]

    headers_priya = {"Authorization": f"Bearer {other_token}"}
    report_res = await client.get(f"/api/v1/interviews/{interview_id}/report", headers=headers_priya)
    assert report_res.status_code == 403
