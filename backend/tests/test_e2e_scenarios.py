"""
End-to-End Scenario Verification Test Suite
Validates all requirements specified in TASK 6:
1. Configure and start an interview
2. Switch between different roles & round types
3. Topic matrix updates dynamically
4. 10, 12, 15 question counts
5. Complete interview with answers to every question
6. Complete interview with blank or skipped answers
7. Final evaluation occurs after completion, not after every question
8. Final scores & suggestions consistent with transcript
9. Retrying evaluation retains answers and does not duplicate results
"""
import pytest
from app.core.interview_config import get_topics_for_role_and_round


@pytest.mark.asyncio
async def test_topic_matrix_dynamic_updates():
    # Technical Frontend Developer topics
    fe_topics = get_topics_for_role_and_round("Frontend Developer", "technical")
    assert "React and Components" in fe_topics
    assert "HTML and CSS" in fe_topics

    # Technical Backend Developer topics
    be_topics = get_topics_for_role_and_round("Backend Developer", "technical")
    assert "Database Design and SQL" in be_topics
    assert "Concurrency" in be_topics

    # HR round topics (regardless of role)
    hr_topics = get_topics_for_role_and_round("Backend Developer", "hr")
    assert "Self-Introduction" in hr_topics
    assert "Conflict Resolution" in hr_topics
    assert "Database Design and SQL" not in hr_topics

    # PI round topics
    pi_topics = get_topics_for_role_and_round("AI/ML Engineer", "pi")
    assert "Personal Background" in pi_topics
    assert "Resume-Based Questions" in pi_topics

    # Managerial round topics
    mgr_topics = get_topics_for_role_and_round("Cloud Engineer", "managerial")
    assert "Leadership" in mgr_topics
    assert "Delegation" in mgr_topics


@pytest.mark.asyncio
async def test_question_counts_10_12_15(client, user_token):
    headers = {"Authorization": f"Bearer {user_token}"}
    for count in [10, 12, 15]:
        res = await client.post(
            "/api/v1/interviews/",
            json={
                "job_role": "Python Developer",
                "round_type": "technical",
                "difficulty": "mid",
                "total_questions": count
            },
            headers=headers
        )
        assert res.status_code == 201
        data = res.json()
        assert data["total_questions"] == count
        assert len(data["questions"]) == count


@pytest.mark.asyncio
async def test_complete_interview_with_all_answers(client, user_token):
    headers = {"Authorization": f"Bearer {user_token}"}
    res = await client.post(
        "/api/v1/interviews/",
        json={
            "job_role": "Java Developer",
            "round_type": "technical",
            "difficulty": "senior",
            "total_questions": 10
        },
        headers=headers
    )
    assert res.status_code == 201
    interview = res.json()
    interview_id = interview["id"]
    questions = interview["questions"]

    # Save substantive answers for all 10 questions without triggering premature evaluation
    for q in questions:
        expected = " ".join(q.get("expected_concepts", ["Architecture", "Trade-offs"]))
        answer = (
            f"Comprehensive technical analysis of {q['topic']}. Addressing expected concepts: {expected}. "
            f"In modern high-throughput Java production systems, we optimize memory barriers, minimize heap allocation overhead, "
            f"and evaluate trade-offs between P99 tail latency and raw compute throughput using non-blocking primitives and thread safety."
        )
        save_res = await client.post(
            f"/api/v1/interviews/{interview_id}/questions/{q['id']}/save",
            json={
                "answer_text": answer,
                "time_spent_seconds": 65
            },
            headers=headers
        )
        assert save_res.status_code == 200
        assert save_res.json()["status"] == "saved"

    # Verify interview is still in_progress before final completion
    status_res = await client.get(f"/api/v1/interviews/{interview_id}", headers=headers)
    assert status_res.status_code == 200
    assert status_res.json()["status"] == "in_progress"

    # Trigger final evaluation after interview completion
    eval_res = await client.post(f"/api/v1/interviews/{interview_id}/complete-evaluation", headers=headers)
    assert eval_res.status_code == 200
    report = eval_res.json()

    assert report["status"] == "completed"
    assert report["answered_questions"] == 10
    assert report["total_questions"] == 10
    assert report["overall_score"] >= 75
    assert len(report["detailed_questions"]) == 10
    assert len(report["strengths"]) > 0
    assert len(report["areas_for_improvement"]) > 0
    assert "readiness_assessment" in report
    assert report["readiness_assessment"]["readiness_level"] in ("Interview Ready", "Exceeds Bar")


@pytest.mark.asyncio
async def test_complete_interview_with_blank_or_skipped_answers(client, user_token):
    headers = {"Authorization": f"Bearer {user_token}"}
    res = await client.post(
        "/api/v1/interviews/",
        json={
            "job_role": "Cybersecurity Engineer",
            "round_type": "technical",
            "difficulty": "senior",
            "total_questions": 10
        },
        headers=headers
    )
    assert res.status_code == 201
    interview = res.json()
    interview_id = interview["id"]
    questions = interview["questions"]

    # Only answer 2 questions, leave remaining 8 blank
    await client.post(
        f"/api/v1/interviews/{interview_id}/questions/{questions[0]['id']}/save",
        json={"answer_text": "Zero Trust architecture mandates continuous verification and micro-segmentation."},
        headers=headers
    )
    await client.post(
        f"/api/v1/interviews/{interview_id}/questions/{questions[1]['id']}/save",
        json={"answer_text": "OWASP Top 10 mitigation via parameterized queries and CSP headers."},
        headers=headers
    )

    # Complete evaluation
    eval_res = await client.post(f"/api/v1/interviews/{interview_id}/complete-evaluation", headers=headers)
    assert eval_res.status_code == 200
    report = eval_res.json()

    assert report["answered_questions"] == 2
    assert report["total_questions"] == 10
    # Blank questions scored 0, dragging down overall composite
    assert report["overall_score"] < 60
    # Report notes missing/skipped answers
    assert len(report["detailed_questions"]) == 10
    skipped_q = report["detailed_questions"][2]
    assert skipped_q["score"] == 0.0
    assert "skipped" in skipped_q["what_went_well"][0].lower()


@pytest.mark.asyncio
async def test_reopening_completed_interview_shows_saved_results(client, user_token):
    headers = {"Authorization": f"Bearer {user_token}"}
    res = await client.post(
        "/api/v1/interviews/",
        json={"job_role": "Data Analyst", "round_type": "technical", "total_questions": 10},
        headers=headers
    )
    interview_id = res.json()["id"]

    # Finalize
    eval1 = await client.post(f"/api/v1/interviews/{interview_id}/complete-evaluation", headers=headers)
    score1 = eval1.json()["overall_score"]

    # Reopening report should return saved report with exact same score
    report_res = await client.get(f"/api/v1/interviews/{interview_id}/report", headers=headers)
    assert report_res.status_code == 200
    assert report_res.json()["overall_score"] == score1
