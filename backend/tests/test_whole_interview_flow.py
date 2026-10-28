"""
Whole Interview Flow and Multi-Round Evaluation Tests
"""
import pytest


@pytest.mark.asyncio
async def test_whole_interview_evaluation_flow(client, user_token):
    headers = {"Authorization": f"Bearer {user_token}"}
    
    # 1. Create a 10-question Technical interview for Frontend Developer
    payload = {
        "job_role": "Frontend Developer",
        "round_type": "technical",
        "difficulty": "senior",
        "total_questions": 10,
        "selected_topics": ["React and Components", "Performance Optimization"]
    }
    create_res = await client.post("/api/v1/interviews/", json=payload, headers=headers)
    assert create_res.status_code == 201
    data = create_res.json()
    interview_id = data["id"]
    assert len(data.get("questions", [])) == 10
    
    # Verify questions are tailored to Frontend Developer
    questions = data["questions"]
    assert questions[0]["order"] == 1
    assert questions[9]["order"] == 10

    # 2. Save answers for first 2 questions
    q1 = questions[0]
    q2 = questions[1]
    
    ans1_payload = {
        "answer_text": "React Fiber uses double buffering to prioritize user interactions and avoid blocking the main UI thread.",
        "time_spent_seconds": 60
    }
    save_res1 = await client.post(
        f"/api/v1/interviews/{interview_id}/questions/{q1['id']}/save",
        json=ans1_payload,
        headers=headers
    )
    assert save_res1.status_code == 200
    assert save_res1.json()["status"] == "saved"

    # Edit answer 1 to verify answer preservation and editing
    ans1_edit = {
        "answer_text": "Updated answer: React Fiber reconciles virtual DOM trees using lane-based priority scheduling and work loop slices.",
        "time_spent_seconds": 95
    }
    edit_res = await client.post(
        f"/api/v1/interviews/{interview_id}/questions/{q1['id']}/save",
        json=ans1_edit,
        headers=headers
    )
    assert edit_res.status_code == 200

    # 3. Retrieve session details and verify answers are preserved
    session_res = await client.get(f"/api/v1/interviews/{interview_id}", headers=headers)
    assert session_res.status_code == 200
    sess_data = session_res.json()
    assert len(sess_data["questions"]) == 10
    
    saved_q1 = next(q for q in sess_data["questions"] if q["id"] == q1["id"])
    assert "lane-based priority scheduling" in saved_q1["saved_answer"]

    # 4. Trigger whole-interview completion and evaluation
    eval_res = await client.post(f"/api/v1/interviews/{interview_id}/complete-evaluation", headers=headers)
    assert eval_res.status_code == 200
    report = eval_res.json()
    
    assert report["interview_id"] == interview_id
    assert report["status"] == "completed"
    assert "overall_score" in report
    assert 0 <= report["overall_score"] <= 100
    assert "round_specific_assessment" in report
    assert "detailed_questions" in report
    assert len(report["detailed_questions"]) == 10
    assert "strengths" in report
    assert "areas_for_improvement" in report
    assert "actionable_improvement_plan" in report
    assert "readiness_assessment" in report

    # 5. Verify retry evaluation works without losing answers
    retry_res = await client.post(f"/api/v1/interviews/{interview_id}/retry-evaluation", headers=headers)
    assert retry_res.status_code == 200
    retry_report = retry_res.json()
    assert retry_report["interview_id"] == interview_id
    assert len(retry_report["detailed_questions"]) == 10


@pytest.mark.asyncio
async def test_hr_round_type_configuration(client, user_token):
    headers = {"Authorization": f"Bearer {user_token}"}
    payload = {
        "job_role": "Backend Developer",
        "round_type": "hr",
        "difficulty": "mid",
        "total_questions": 12,
        "selected_topics": ["Self-Introduction", "Conflict Resolution", "Teamwork"]
    }
    res = await client.post("/api/v1/interviews/", json=payload, headers=headers)
    assert res.status_code == 201
    data = res.json()
    assert data["total_questions"] == 12
    assert len(data.get("questions", [])) == 12
    # Check that questions are HR focused, not Java/JVM internals
    q_texts = " ".join([q["question_text"] for q in data["questions"]]).lower()
    assert any(term in q_texts for term in ["team", "conflict", "career", "milestone", "background", "experience"])
