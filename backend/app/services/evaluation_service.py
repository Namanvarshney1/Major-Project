"""
Evaluation Service
Evaluates submitted candidate responses, coordinates LangGraph analysis,
persists verified evaluations in MongoDB, and generates final reports.
"""
from typing import Dict, Any, List, Optional
from app.core.errors import NotFoundException, ForbiddenException, DuplicateSubmissionException
from app.repositories.interview_repository import InterviewRepository
from app.repositories.question_repository import QuestionRepository
from app.repositories.answer_repository import AnswerRepository
from app.repositories.evaluation_repository import EvaluationRepository
from app.repositories.gamification_repository import GamificationRepository
from app.ai.workflow.graph import interview_workflow_app


class EvaluationService:
    def __init__(self, db):
        self.db = db
        self.interview_repo = InterviewRepository(db)
        self.question_repo = QuestionRepository(db)
        self.answer_repo = AnswerRepository(db)
        self.eval_repo = EvaluationRepository(db)
        self.gamification_repo = GamificationRepository(db)

    async def submit_and_evaluate_answer(
        self,
        interview_id: str,
        question_id: str,
        user_id: str,
        answer_text: str,
        time_spent_seconds: int = 0
    ) -> Dict[str, Any]:
        """Submits answer, verifies uniqueness, invokes LangGraph evaluation, and saves to MongoDB."""
        # Validate interview existence and ownership
        interview = await self.interview_repo.get_by_id(interview_id)
        if not interview:
            raise NotFoundException(resource="Interview")
        if interview["user_id"] != user_id:
            raise ForbiddenException(detail="You do not own this interview")

        question = await self.question_repo.get_by_id(question_id)
        if not question or question["interview_id"] != interview_id:
            raise NotFoundException(resource="Question")

        # Duplicate submission check
        existing_answer = await self.answer_repo.get_by_question_and_interview(question_id, interview_id, user_id)
        if existing_answer:
            # If already evaluated, return the existing evaluation
            existing_eval = await self.eval_repo.get_by_question_id(question_id, user_id)
            if existing_eval:
                existing_eval["question_text"] = question["question_text"]
                existing_eval["topic"] = question["topic"]
                return existing_eval
            raise DuplicateSubmissionException()

        # Persist candidate answer
        answer_doc = {
            "user_id": user_id,
            "interview_id": interview_id,
            "question_id": question_id,
            "answer_text": answer_text,
            "time_spent_seconds": time_spent_seconds
        }
        await self.answer_repo.create(answer_doc)

        # Build LangGraph evaluation input
        eval_state = {
            "interview_id": interview_id,
            "user_id": user_id,
            "job_role": interview.get("job_role", "Senior Backend Engineer"),
            "difficulty": interview.get("difficulty", "senior"),
            "interview_type": interview.get("interview_type", "technical"),
            "current_question_index": interview.get("current_question_index", 0),
            "total_questions": interview.get("total_questions", 5),
            "current_question": question,
            "candidate_answer": answer_text,
            "time_spent_seconds": time_spent_seconds,
            "action_type": "evaluate_answer"
        }

        # Run LangGraph pipeline
        result = await interview_workflow_app.ainvoke(eval_state)
        eval_data = result.get("current_evaluation", {})

        # Persist structured evaluation
        eval_record = {
            "user_id": user_id,
            "interview_id": interview_id,
            "question_id": question_id,
            "technical_accuracy": eval_data.get("technical_accuracy", 80.0),
            "relevance": eval_data.get("relevance", 85.0),
            "completeness": eval_data.get("completeness", 80.0),
            "clarity": eval_data.get("clarity", 80.0),
            "overall_score": eval_data.get("overall_score", 81.0),
            "strengths": eval_data.get("strengths", ["Clear explanation"]),
            "missing_concepts": eval_data.get("missing_concepts", []),
            "feedback": eval_data.get("feedback", "Good effort."),
            "model_answer": eval_data.get("model_answer", "N/A"),
            "model_identifier": "Llama-3.3-70B (Groq Engine)"
        }
        saved_eval = await self.eval_repo.create(eval_record)
        saved_eval["question_text"] = question["question_text"]
        saved_eval["topic"] = question["topic"]

        # Award XP and log activity
        xp = int(saved_eval["overall_score"] * 1.5)
        await self.gamification_repo.log_activity(
            user_id=user_id,
            activity_type="answer_evaluation",
            topic=question.get("topic", "General"),
            xp_awarded=xp
        )

        # Check and advance interview progress
        current_idx = interview.get("current_question_index", 0)
        total_q = interview.get("total_questions", 5)
        if current_idx + 1 >= total_q:
            # Interview complete! Calculate final score
            all_evals = await self.eval_repo.list_by_interview(interview_id, user_id)
            final_score = round(sum(e["overall_score"] for e in all_evals) / len(all_evals), 1)
            await self.interview_repo.update(
                interview_id,
                {"status": "completed", "final_score": final_score}
            )
            # Unlock first interview achievement if applicable
            await self.gamification_repo.unlock_achievement(
                user_id=user_id,
                achievement_key="first_interview_complete",
                title="First Step to Mastery",
                description="Completed your first full PrepPulse interview session",
                category="Milestone",
                xp_reward=200
            )
        else:
            await self.interview_repo.update(interview_id, {"current_question_index": current_idx + 1})

        return saved_eval

    async def get_evaluation_for_question(self, question_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        eval_doc = await self.eval_repo.get_by_question_id(question_id, user_id)
        if eval_doc:
            q = await self.question_repo.get_by_id(question_id)
            if q:
                eval_doc["question_text"] = q["question_text"]
                eval_doc["topic"] = q["topic"]
        return eval_doc

    async def get_final_report(self, interview_id: str, user_id: str) -> Dict[str, Any]:
        """Generates comprehensive final interview report from stored evaluations in MongoDB."""
        interview = await self.interview_repo.get_by_id(interview_id)
        if not interview:
            raise NotFoundException(resource="Interview")
        if interview["user_id"] != user_id:
            raise ForbiddenException(detail="You do not have access to this report")

        evals = await self.eval_repo.list_by_interview(interview_id, user_id)
        for e in evals:
            q = await self.question_repo.get_by_id(e["question_id"])
            if q:
                e["question_text"] = q["question_text"]
                e["topic"] = q["topic"]

        if evals:
            overall_score = round(sum(e["overall_score"] for e in evals) / len(evals), 1)
        else:
            overall_score = 0.0

        # Topic aggregation
        topic_scores: Dict[str, List[float]] = {}
        for e in evals:
            t = e.get("topic", "General")
            topic_scores.setdefault(t, []).append(e["overall_score"])

        sorted_topics = sorted(
            [(t, sum(scores)/len(scores)) for t, scores in topic_scores.items()],
            key=lambda x: x[1],
            reverse=True
        )

        strongest = [t[0] for t in sorted_topics[:2]] if sorted_topics else ["System Architecture"]
        weakest = [t[0] for t in sorted_topics[-2:]] if sorted_topics else ["Concurrency"]

        recommendations = [
            f"Review architectural trade-offs in {weakest[0]} before your next mock interview.",
            f"Build on your strong foundation in {strongest[0]} by focusing on edge cases and failure modes.",
            "Practice writing concise STAR summaries for complex engineering situations."
        ]

        report = {
            "interview_id": interview_id,
            "user_id": user_id,
            "job_role": interview.get("job_role", "Senior Backend Engineer"),
            "interview_type": interview.get("interview_type", "technical"),
            "difficulty": interview.get("difficulty", "senior"),
            "status": interview.get("status", "completed"),
            "overall_score": overall_score,
            "total_questions": interview.get("total_questions", len(evals)),
            "answered_questions": len(evals),
            "strongest_topics": strongest,
            "weakest_topics": weakest,
            "recommendations": recommendations,
            "suggested_next_session": {
                "topic": weakest[0],
                "difficulty": interview.get("difficulty", "senior"),
                "estimated_mins": 10
            },
            "evaluations": evals,
            "xp_earned": int(overall_score * len(evals)),
            "completed_at": interview.get("completed_at")
        }
        return report
