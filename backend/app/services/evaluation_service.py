"""
Evaluation Service
Evaluates submitted candidate responses, coordinates whole-interview analysis,
persists verified evaluations in MongoDB, and generates final debrief reports.
"""
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from app.core.errors import NotFoundException, ForbiddenException, DuplicateSubmissionException
from app.repositories.interview_repository import InterviewRepository
from app.repositories.question_repository import QuestionRepository
from app.repositories.answer_repository import AnswerRepository
from app.repositories.evaluation_repository import EvaluationRepository
from app.repositories.gamification_repository import GamificationRepository
from app.services.groq_evaluation_service import groq_evaluation_service


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
        time_spent_seconds: int = 0,
        evaluate_immediate: bool = False
    ) -> Dict[str, Any]:
        """Saves candidate answer and performs semantic Groq evaluation."""
        interview = await self.interview_repo.get_by_id(interview_id)
        if not interview:
            raise NotFoundException(resource="Interview")
        if interview["user_id"] != user_id:
            raise ForbiddenException(detail="You do not own this interview")

        question = await self.question_repo.get_by_id(question_id)
        if not question or question["interview_id"] != interview_id:
            raise NotFoundException(resource="Question")

        # Save or update answer in MongoDB
        saved_answer = await self.answer_repo.upsert(
            question_id=question_id,
            interview_id=interview_id,
            user_id=user_id,
            answer_text=answer_text,
            time_spent_seconds=time_spent_seconds
        )

        # Check if already evaluated
        existing_eval = await self.eval_repo.get_by_question_id(question_id, user_id)
        if existing_eval:
            existing_eval["question_text"] = question["question_text"]
            existing_eval["topic"] = question["topic"]
            return existing_eval

        # Semantic Groq evaluation
        role = interview.get("job_role", "Software Engineer")
        round_type = interview.get("round_type") or interview.get("interview_type", "technical")
        difficulty = interview.get("difficulty", "senior")

        eval_result = await groq_evaluation_service.evaluate_answer(
            question=question,
            answer_text=answer_text,
            job_role=role,
            round_type=round_type,
            difficulty=difficulty
        )

        eval_record = {
            "user_id": user_id,
            "interview_id": interview_id,
            "question_id": question_id,
            "technical_accuracy": eval_result["correctness_score"],
            "relevance": eval_result["relevance_score"],
            "completeness": eval_result["completeness_score"],
            "clarity": eval_result["reasoning_score"],
            "overall_score": eval_result["overall_score"],
            "is_relevant": eval_result.get("is_relevant", True),
            "strengths": eval_result.get("strengths", []),
            "missing_concepts": eval_result.get("missing_concepts", []),
            "feedback": eval_result.get("feedback", ""),
            "model_answer": eval_result.get("model_answer", ""),
            "improvement_suggestion": eval_result.get("improvement_suggestion", ""),
            "evidence": eval_result.get("evidence", []),
            "model_identifier": "PrepPulse Groq Evaluation Engine"
        }
        saved_eval = await self.eval_repo.create(eval_record)
        saved_eval["question_text"] = question["question_text"]
        saved_eval["topic"] = question["topic"]

        # Award XP based on verified evaluation
        xp = int(saved_eval["overall_score"] * 1.5)
        await self.gamification_repo.log_activity(
            user_id=user_id,
            activity_type="answer_evaluation",
            topic=question.get("topic", "General"),
            xp_awarded=xp
        )

        return saved_eval

    async def evaluate_complete_session(self, interview_id: str, user_id: str) -> Dict[str, Any]:
        """
        Triggers whole-interview evaluation across all questions and answers using Groq.
        Stores comprehensive report and updates overall status and scores.
        """
        interview = await self.interview_repo.get_by_id(interview_id)
        if not interview:
            raise NotFoundException(resource="Interview")
        if interview["user_id"] != user_id:
            raise ForbiddenException(detail="You do not own this interview")

        # If already evaluated and completed, return existing saved report
        if interview.get("status") == "completed" and interview.get("report"):
            saved_report = interview["report"]
            saved_report["interview_id"] = interview_id
            saved_report["user_id"] = user_id
            return saved_report

        questions = await self.question_repo.list_by_interview(interview_id)
        answers = await self.answer_repo.list_by_interview(interview_id, user_id)

        # Run whole-interview evaluation engine with Groq
        try:
            report = await groq_evaluation_service.evaluate_whole_interview(
                interview=interview,
                questions=questions,
                answers=answers
            )
        except Exception as exc:
            # Preserve transcript and mark retryable error state on interview
            await self.interview_repo.update(
                interview_id,
                {"status": "evaluation_failed", "last_evaluation_error": str(exc)}
            )
            raise

        now = datetime.now(timezone.utc)
        overall_score = report["overall_score"]

        # Persist individual evaluations into eval_repo so DNA, Coach, and Skill Tree update
        persisted_evals = []
        for q_eval in report.get("detailed_questions", []):
            eval_record = {
                "user_id": user_id,
                "interview_id": interview_id,
                "question_id": q_eval["question_id"],
                "technical_accuracy": q_eval["technical_accuracy"],
                "relevance": q_eval["relevance"],
                "completeness": q_eval["completeness"],
                "clarity": q_eval["clarity"],
                "overall_score": q_eval["score"],
                "strengths": q_eval["what_went_well"],
                "missing_concepts": q_eval["what_was_missing"],
                "feedback": q_eval["improvement_suggestion"],
                "model_answer": q_eval["stronger_answer_example"],
                "model_identifier": "PrepPulse Groq Evaluation Matrix"
            }
            # Persist or update evaluation document
            saved = await self.eval_repo.upsert(eval_record)
            saved["question_text"] = q_eval["question_text"]
            saved["topic"] = q_eval["topic"]
            saved["candidate_answer"] = q_eval["candidate_answer"]
            persisted_evals.append(saved)

        # Update interview with report, status, and completion time
        update_data = {
            "status": "completed",
            "final_score": overall_score,
            "completed_at": now,
            "report": report,
            "last_evaluation_error": None
        }
        await self.interview_repo.update(interview_id, update_data)

        # Log gamification XP
        total_xp = report.get("xp_earned", int(overall_score * 10))
        await self.gamification_repo.log_activity(
            user_id=user_id,
            activity_type="interview_completion",
            topic=report["strongest_topics"][0] if report["strongest_topics"] else "General",
            xp_awarded=total_xp
        )

        # Unlock Milestone Achievement if first completed
        await self.gamification_repo.unlock_achievement(
            user_id=user_id,
            achievement_key="first_interview_complete",
            title="First Step to Mastery",
            description="Completed your first full PrepPulse interview session",
            category="Milestone",
            xp_reward=200
        )

        # Format full return response
        report["interview_id"] = interview_id
        report["user_id"] = user_id
        report["status"] = "completed"
        report["completed_at"] = now
        report["evaluations"] = persisted_evals
        report["suggested_next_session"] = {
            "topic": report["weakest_topics"][0] if report["weakest_topics"] else "System Architecture",
            "difficulty": interview.get("difficulty", "senior"),
            "estimated_mins": 15
        }
        return report

    async def retry_evaluation(self, interview_id: str, user_id: str) -> Dict[str, Any]:
        """Clears cached report and re-runs whole-interview evaluation on existing transcript."""
        interview = await self.interview_repo.get_by_id(interview_id)
        if not interview:
            raise NotFoundException(resource="Interview")
        if interview["user_id"] != user_id:
            raise ForbiddenException(detail="You do not own this interview")

        # Clear report and failure status to force re-evaluation
        await self.interview_repo.update(interview_id, {"report": None, "status": "in_progress", "last_evaluation_error": None})
        return await self.evaluate_complete_session(interview_id, user_id)

    async def get_evaluation_for_question(self, question_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        eval_doc = await self.eval_repo.get_by_question_id(question_id, user_id)
        if eval_doc:
            q = await self.question_repo.get_by_id(question_id)
            if q:
                eval_doc["question_text"] = q["question_text"]
                eval_doc["topic"] = q["topic"]
        return eval_doc

    async def get_final_report(self, interview_id: str, user_id: str) -> Dict[str, Any]:
        """Retrieves or generates final report."""
        interview = await self.interview_repo.get_by_id(interview_id)
        if not interview:
            raise NotFoundException(resource="Interview")
        if interview["user_id"] != user_id:
            raise ForbiddenException(detail="You do not have access to this report")

        # If already has saved report, return it
        if interview.get("report"):
            report = interview["report"]
            report["interview_id"] = interview_id
            report["user_id"] = user_id
            report["status"] = interview.get("status", "completed")
            report["completed_at"] = interview.get("completed_at")
            evals = await self.eval_repo.list_by_interview(interview_id, user_id)
            report["evaluations"] = evals
            return report

        # Otherwise evaluate now
        return await self.evaluate_complete_session(interview_id, user_id)
