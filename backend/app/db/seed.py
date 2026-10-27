"""
Seed Database Helper
Ensures default Admin and Demo Candidate (Arjun Patel) accounts exist
with rich telemetry out of the box for evaluators.
"""
from datetime import datetime, timezone, timedelta
from app.core.security import hash_password
from app.core.logging import logger


async def seed_default_accounts(db):
    """Seeds Admin and Arjun Patel accounts if they don't already exist."""
    users_col = db.users
    interviews_col = db.interviews
    questions_col = db.questions
    answers_col = db.answers
    evaluations_col = db.evaluations
    achievements_col = db.achievements
    practice_col = db.practice_activity

    now = datetime.now(timezone.utc)

    # 1. Admin Account
    admin_user = await users_col.find_one({"email": "admin@preppulse.ai"})
    if not admin_user:
        admin_doc = {
            "name": "PrepPulse Administrator",
            "email": "admin@preppulse.ai",
            "password_hash": hash_password("AdminPassword123!"),
            "profile": {
                "target_role": "Platform Administrator / Evaluator",
                "target_level": "Staff / Lead",
                "experience_years": 8,
                "primary_language": "Python / TypeScript"
            },
            "preferences": {
                "theme": "light",
                "timed_mode_default": True,
                "sound_enabled": True
            },
            "created_at": now.isoformat(),
            "updated_at": now.isoformat()
        }
        res = await users_col.insert_one(admin_doc)
        admin_id = str(res.inserted_id)
        logger.info(f"Seeded Admin Account: admin@preppulse.ai (ID: {admin_id})")

    # 2. Demo Candidate (Arjun Patel)
    arjun_user = await users_col.find_one({"email": "arjun.patel@example.com"})
    if not arjun_user:
        arjun_doc = {
            "name": "Arjun Patel",
            "email": "arjun.patel@example.com",
            "password_hash": hash_password("ValidPassword123!"),
            "profile": {
                "target_role": "Senior Backend Engineer (Java & Distributed Systems)",
                "target_level": "Senior IC",
                "experience_years": 4,
                "primary_language": "Java"
            },
            "preferences": {
                "theme": "light",
                "timed_mode_default": True,
                "sound_enabled": True
            },
            "created_at": (now - timedelta(days=5)).isoformat(),
            "updated_at": now.isoformat()
        }
        res = await users_col.insert_one(arjun_doc)
        arjun_id = str(res.inserted_id)
        logger.info(f"Seeded Demo Candidate Account: arjun.patel@example.com (ID: {arjun_id})")

        # Seed Completed Interview for Arjun so his Dashboard, DNA, and Report are live
        interview_doc = {
            "user_id": arjun_id,
            "job_role": "Senior Backend Engineer (Java & Distributed Systems)",
            "interview_type": "technical",
            "difficulty": "senior",
            "selected_topics": ["Distributed Systems", "SQL Indexing"],
            "total_questions": 2,
            "current_question_index": 2,
            "status": "completed",
            "final_score": 88.0,
            "timed_mode": True,
            "created_at": (now - timedelta(days=1)).isoformat(),
            "completed_at": (now - timedelta(days=1, hours=-1)).isoformat()
        }
        int_res = await interviews_col.insert_one(interview_doc)
        interview_id = str(int_res.inserted_id)

        # Questions
        q1 = {
            "interview_id": interview_id,
            "user_id": arjun_id,
            "question_text": "How do LSM-Trees compare to B+ Trees in high-write transactional systems?",
            "topic": "Distributed Storage & Indexing",
            "difficulty": "senior",
            "expected_concepts": ["Sequential I/O", "MemTable", "Write-Ahead Log (WAL)", "Compaction"],
            "evaluation_rubric": {"technical_depth": 30, "practical_tradeoffs": 30},
            "order": 0,
            "created_at": (now - timedelta(days=1)).isoformat()
        }
        q1_res = await questions_col.insert_one(q1)
        q1_id = str(q1_res.inserted_id)

        q2 = {
            "interview_id": interview_id,
            "user_id": arjun_id,
            "question_text": "Explain the Saga Pattern and how it achieves eventual consistency across microservice boundaries without 2PC.",
            "topic": "Distributed Architecture",
            "difficulty": "senior",
            "expected_concepts": ["Compensating Transactions", "Orchestration vs Choreography", "Eventual Consistency"],
            "evaluation_rubric": {"consistency_models": 35, "failure_recovery": 35},
            "order": 1,
            "created_at": (now - timedelta(days=1)).isoformat()
        }
        q2_res = await questions_col.insert_one(q2)
        q2_id = str(q2_res.inserted_id)

        # Answers
        await answers_col.insert_one({
            "interview_id": interview_id,
            "question_id": q1_id,
            "user_id": arjun_id,
            "answer_text": "LSM-Trees buffer writes in memory (MemTable) and append sequentially to a WAL, yielding high write throughput. In contrast, B+ Trees perform in-place page updates requiring random I/O.",
            "submitted_at": (now - timedelta(days=1)).isoformat()
        })
        await answers_col.insert_one({
            "interview_id": interview_id,
            "question_id": q2_id,
            "user_id": arjun_id,
            "answer_text": "Sagas split a distributed transaction into a sequence of local transactions. Each transaction updates its local database and publishes an event. If a step fails, compensating transactions execute backwards.",
            "submitted_at": (now - timedelta(days=1)).isoformat()
        })

        # Evaluations
        await evaluations_col.insert_one({
            "interview_id": interview_id,
            "question_id": q1_id,
            "user_id": arjun_id,
            "technical_accuracy": 90.0,
            "relevance": 92.0,
            "completeness": 85.0,
            "clarity": 88.0,
            "overall_score": 88.75,
            "strengths": ["Excellent distinction between sequential log appends and random I/O", "Clear explanation of MemTable buffering"],
            "missing_concepts": ["Bloom filters to avoid reading absent SSTables on disk"],
            "feedback": "Strong architectural foundation. Mentioning Bloom filters would make this staff-level.",
            "model_answer": "LSM-Trees optimize for write velocity by appending writes to an in-memory MemTable and disk WAL sequentially. Flushed immutable SSTables are later merged via compaction.",
            "model_identifier": "llama-3.3-70b-versatile",
            "created_at": (now - timedelta(days=1)).isoformat()
        })
        await evaluations_col.insert_one({
            "interview_id": interview_id,
            "question_id": q2_id,
            "user_id": arjun_id,
            "technical_accuracy": 88.0,
            "relevance": 90.0,
            "completeness": 84.0,
            "clarity": 87.0,
            "overall_score": 87.25,
            "strengths": ["Clear description of compensating transactions", "Good contrast with Two-Phase Commit locks"],
            "missing_concepts": ["Idempotency keys to handle duplicate event retries"],
            "feedback": "Solid understanding of eventual consistency and undo actions.",
            "model_answer": "The Saga pattern coordinates distributed transactions using local ACID commits paired with explicit compensating actions.",
            "model_identifier": "llama-3.3-70b-versatile",
            "created_at": (now - timedelta(days=1)).isoformat()
        })

        # Achievements & XP
        await achievements_col.insert_one({
            "user_id": arjun_id,
            "achievement_key": "first_interview",
            "earned_at": (now - timedelta(days=1)).isoformat()
        })
        await achievements_col.insert_one({
            "user_id": arjun_id,
            "achievement_key": "score_master",
            "earned_at": (now - timedelta(days=1)).isoformat()
        })
        await practice_col.insert_one({
            "user_id": arjun_id,
            "activity_type": "interview_completion",
            "topic": "Distributed Storage & Indexing",
            "xp_awarded": 250,
            "created_at": (now - timedelta(days=1)).isoformat()
        })
