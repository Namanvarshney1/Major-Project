"""
AI Coach Service
Analyzes stored candidate evaluations to prescribe personalized drills and revision paths.
"""
from typing import Dict, Any, List
from app.repositories.evaluation_repository import EvaluationRepository
from app.repositories.interview_repository import InterviewRepository
from app.repositories.user_repository import UserRepository


class CoachService:
    def __init__(self, db):
        self.db = db
        self.eval_repo = EvaluationRepository(db)
        self.interview_repo = InterviewRepository(db)
        self.user_repo = UserRepository(db)

    async def get_coaching_recommendation(self, user_id: str) -> Dict[str, Any]:
        """Prescribes personalized focus tasks based on actual evaluation history."""
        user = await self.user_repo.get_by_id(user_id)
        user_name = user.get("name", "Candidate") if user else "Candidate"
        profile = user.get("profile", {}) if user else {}
        target_role = profile.get("target_role", "Senior Backend Engineer (Java & Distributed Systems)")
        target_level = profile.get("target_level", "L5/Senior IC")

        completed_interviews = await self.interview_repo.list_by_user(user_id, status="completed", limit=100)
        evals = await self.eval_repo.get_all_by_user(user_id)

        if not evals:
            prescription = {
                "ref_id": "INIT-101",
                "title": "Core Architecture Baseline",
                "description": "You have not completed any interview evaluations yet. Take your first 5-question baseline interview to calibrate your Interview DNA.",
                "focus_topics": ["Concurrency & Locks", "System Architecture"],
                "recommended_difficulty": "mid",
                "estimated_mins": 10,
                "scenarios_count": 5,
                "projected_gain": "+12% CALIBRATION GAIN",
                "impact": "Baseline Calibration",
                "history_based": False,
                "rationale": "Establishes baseline radar metrics across Technical Accuracy, Clarity, and Relevance."
            }
            drills = [
                {
                    "id": "drill-1",
                    "title": "Database Indexing & B+ Trees",
                    "topic": "Database Indexing & B+ Trees",
                    "difficulty": "Mid",
                    "time_mins": 10,
                    "reason": "Crucial foundational topic for backend database scalability."
                },
                {
                    "id": "drill-2",
                    "title": "Concurrency & Locks",
                    "topic": "Concurrency & Locks",
                    "difficulty": "Senior",
                    "time_mins": 12,
                    "reason": "Test mutex primitives, race condition mitigation, and thread safety."
                },
                {
                    "id": "drill-3",
                    "title": "Distributed Transactions & Sagas",
                    "topic": "Distributed Transactions (2PC vs Saga)",
                    "difficulty": "Senior",
                    "time_mins": 15,
                    "reason": "Essential for microservices consistency and compensation logic."
                }
            ]
            historical_diagnostic = {
                "completed_interviews": len(completed_interviews),
                "average_score": 0.0,
                "detected_weaknesses": ["System Architecture", "Distributed Transactions"],
                "needs_baseline": True
            }
            return {
                "user_name": user_name,
                "target_role": target_role,
                "target_level": target_level,
                "prescription": prescription,
                "drills": drills,
                "historical_diagnostic": historical_diagnostic,
                "has_history": False,
                "title": "Initial Diagnostic Assessment Recommended",
                "summary": "You have not completed any interview evaluations yet. Take your first 5-question baseline interview to calibrate your Interview DNA.",
                "prescriptions": [prescription],
                "weak_topics": [],
                "improving_topics": []
            }

        # Analyze topic scores from real history
        topic_scores: Dict[str, List[float]] = {}
        for ev in evals:
            t = ev.get("topic", "System Architecture")
            topic_scores.setdefault(t, []).append(ev.get("overall_score", 70.0))

        sorted_topics = sorted(
            [(t, sum(s)/len(s)) for t, s in topic_scores.items()],
            key=lambda x: x[1]
        )

        weak_topic = sorted_topics[0][0]
        strong_topic = sorted_topics[-1][0]
        avg_score = round(sum(e["overall_score"] for e in evals) / len(evals), 1)

        focus_topics = [weak_topic]
        if len(sorted_topics) > 1 and sorted_topics[1][0] != weak_topic:
            focus_topics.append(sorted_topics[1][0])
        else:
            focus_topics.append("System Architecture")

        prescription = {
            "ref_id": "GC-702",
            "title": f"Strengthen {weak_topic} Mechanics",
            "description": f"Your evaluations highlight key opportunities when reasoning through {weak_topic}. Complete a targeted 10-minute focus sprint to sharpen your trade-offs.",
            "focus_topics": focus_topics,
            "recommended_difficulty": "senior",
            "estimated_mins": 10,
            "scenarios_count": 3,
            "projected_gain": "+8.4% PROJECTED MASTERY",
            "impact": "High Impact",
            "history_based": True,
            "rationale": f"Recent evaluations show a performance inflection point in {weak_topic} (Avg: {int(sorted_topics[0][1])}%). Focused drills will raise your composite score."
        }

        drills = [
            {
                "id": "drill-weak",
                "title": f"Targeted: {weak_topic}",
                "topic": weak_topic,
                "difficulty": "Senior",
                "time_mins": 10,
                "reason": f"Directly targets detected weakness in {weak_topic}."
            },
            {
                "id": "drill-strong",
                "title": f"Staff-Level: {strong_topic}",
                "topic": strong_topic,
                "difficulty": "Staff",
                "time_mins": 15,
                "reason": f"Elevate proficiency in your strongest area ({strong_topic}) to Staff level."
            },
            {
                "id": "drill-breadth",
                "title": "Distributed Transactions & Sagas",
                "topic": "Distributed Transactions (2PC vs Saga)",
                "difficulty": "Senior",
                "time_mins": 12,
                "reason": "Reinforce microservices consistency models and compensating actions."
            }
        ]

        historical_diagnostic = {
            "completed_interviews": len(completed_interviews),
            "average_score": avg_score,
            "detected_weaknesses": [t[0] for t in sorted_topics[:3]],
            "needs_baseline": False
        }

        return {
            "user_name": user_name,
            "target_role": target_role,
            "target_level": target_level,
            "prescription": prescription,
            "drills": drills,
            "historical_diagnostic": historical_diagnostic,
            "has_history": True,
            "title": f"Focus Sprint: {weak_topic}",
            "summary": f"Your current readiness score is {avg_score}%. Closing the gap in {weak_topic} will yield the highest diagnostic delta.",
            "prescriptions": [prescription],
            "weak_topics": [t[0] for t in sorted_topics[:3]],
            "improving_topics": [t[0] for t in sorted_topics[-3:]]
        }
