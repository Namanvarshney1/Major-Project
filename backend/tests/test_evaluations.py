"""
Answer Submission & AI Evaluation Tests
"""
import pytest


@pytest.mark.asyncio
async def test_submit_and_evaluate_answer(client, user_token):
    headers = {"Authorization": f"Bearer {user_token}"}
    create_res = await client.post(
        "/api/v1/interviews/",
        json={"total_questions": 2},
        headers=headers
    )
    assert create_res.status_code == 201
    interview_data = create_res.json()
    interview_id = interview_data["id"]
    question_id = interview_data["current_question"]["id"]

    answer_payload = {
        "answer_text": (
            "In synchronous programming, tasks execute sequentially where the thread blocks during I/O. "
            "In asynchronous non-blocking I/O (such as Netty or Java NIO), a single event loop thread multiplexes "
            "thousands of connections using epoll, avoiding the 1MB per thread stack memory overhead."
        ),
        "time_spent_seconds": 120
    }
    eval_res = await client.post(
        f"/api/v1/interviews/{interview_id}/questions/{question_id}/answer",
        json=answer_payload,
        headers=headers
    )
    assert eval_res.status_code == 200
    eval_data = eval_res.json()
    assert "overall_score" in eval_data
    assert 0 <= eval_data["overall_score"] <= 100
    assert "technical_accuracy" in eval_data
    assert "strengths" in eval_data
    assert len(eval_data["strengths"]) >= 1
    assert "missing_concepts" in eval_data
    assert "model_answer" in eval_data
    assert "feedback" in eval_data


@pytest.mark.asyncio
async def test_duplicate_submission_handling(client, user_token):
    headers = {"Authorization": f"Bearer {user_token}"}
    create_res = await client.post(
        "/api/v1/interviews/",
        json={"total_questions": 2},
        headers=headers
    )
    interview_data = create_res.json()
    interview_id = interview_data["id"]
    question_id = interview_data["current_question"]["id"]

    answer_payload = {
        "answer_text": "First valid submission explaining Virtual Threads and non-blocking I/O.",
        "time_spent_seconds": 90
    }
    res1 = await client.post(
        f"/api/v1/interviews/{interview_id}/questions/{question_id}/answer",
        json=answer_payload,
        headers=headers
    )
    assert res1.status_code == 200

    # Second submission for the exact same question in this interview
    res2 = await client.post(
        f"/api/v1/interviews/{interview_id}/questions/{question_id}/answer",
        json=answer_payload,
        headers=headers
    )
    # Returns existing evaluation safely without error or double scoring
    assert res2.status_code == 200
    assert res2.json()["id"] == res1.json()["id"]


@pytest.mark.asyncio
async def test_get_final_report(client, user_token):
    headers = {"Authorization": f"Bearer {user_token}"}
    create_res = await client.post(
        "/api/v1/interviews/",
        json={"total_questions": 1},
        headers=headers
    )
    interview_data = create_res.json()
    interview_id = interview_data["id"]
    question_id = interview_data["current_question"]["id"]

    # Submit only question to finish interview
    await client.post(
        f"/api/v1/interviews/{interview_id}/questions/{question_id}/answer",
        json={"answer_text": "Comprehensive analysis of distributed sagas vs 2PC."},
        headers=headers
    )

    report_res = await client.get(f"/api/v1/interviews/{interview_id}/report", headers=headers)
    assert report_res.status_code == 200
    report_data = report_res.json()
    assert report_data["interview_id"] == interview_id
    assert report_data["status"] == "completed"
    assert "strongest_topics" in report_data
    assert "weakest_topics" in report_data
    assert len(report_data["recommendations"]) > 0
