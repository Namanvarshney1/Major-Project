"""
Interview Service
Orchestrates interview setup, comprehensive question generation, session persistence, and navigation.
"""
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
from app.core.errors import NotFoundException, ForbiddenException, PrepPulseException
from app.repositories.interview_repository import InterviewRepository
from app.repositories.question_repository import QuestionRepository
from app.repositories.answer_repository import AnswerRepository
from app.repositories.evaluation_repository import EvaluationRepository
from app.schemas.interview import InterviewCreate
from app.ai.question_generator import generate_questions_for_interview, get_curated_fallback_question
from app.core.interview_config import get_topics_for_role_and_round


class InterviewService:
    def __init__(self, db):
        self.db = db
        self.interview_repo = InterviewRepository(db)
        self.question_repo = QuestionRepository(db)
        self.answer_repo = AnswerRepository(db)
        self.eval_repo = EvaluationRepository(db)

    async def create_interview(self, user_id: str, create_data: InterviewCreate) -> Dict[str, Any]:
        """Creates a new interview session and generates all questions upfront for seamless navigation."""
        round_type = InterviewCreate.normalize_round(create_data.round_type or create_data.interview_type or "technical")
        selected_topics = create_data.selected_topics
        if not selected_topics:
            selected_topics = get_topics_for_role_and_round(create_data.job_role, round_type)

        interview_dict = {
            "user_id": user_id,
            "job_role": create_data.job_role,
            "round_type": round_type,
            "interview_type": round_type,
            "difficulty": create_data.difficulty,
            "selected_topics": selected_topics,
            "total_questions": create_data.total_questions,
            "timed_mode": create_data.timed_mode,
            "time_limit_mins": create_data.time_limit_mins
        }
        interview = await self.interview_repo.create(interview_dict)
        interview_id = interview["id"]

        # Generate all session questions upfront
        generated_questions = await generate_questions_for_interview(
            job_role=create_data.job_role,
            round_type=round_type,
            difficulty=create_data.difficulty,
            selected_topics=selected_topics,
            total_questions=create_data.total_questions
        )

        saved_questions = []
        for q_data in generated_questions:
            q_doc = {
                "user_id": user_id,
                "interview_id": interview_id,
                "question_text": q_data["question_text"],
                "topic": q_data["topic"],
                "difficulty": q_data.get("difficulty", create_data.difficulty),
                "expected_concepts": q_data.get("expected_concepts", ["System Architecture"]),
                "evaluation_rubric": q_data.get("evaluation_rubric", "Standard engineering evaluation rubric"),
                "order": q_data["order"]
            }
            saved_q = await self.question_repo.create(q_doc)
            saved_questions.append(saved_q)

        interview["questions"] = saved_questions
        interview["current_question"] = saved_questions[0] if saved_questions else None
        return interview

    async def get_interview_session(self, interview_id: str, user_id: str) -> Dict[str, Any]:
        """Fetches active interview session with complete question list and saved answers."""
        interview = await self.interview_repo.get_by_id(interview_id)
        if not interview:
            raise NotFoundException(resource="Interview session")
        if interview["user_id"] != user_id:
            raise ForbiddenException(detail="You do not have access to this interview session")

        # Load all questions for this interview
        questions = await self.question_repo.list_by_interview(interview_id)
        
        # If questions list is empty or incomplete, generate missing questions
        total_q = interview.get("total_questions", 10)
        if len(questions) < total_q and interview.get("status") == "in_progress":
            role = interview.get("job_role", "Software Engineer")
            round_type = interview.get("round_type") or interview.get("interview_type", "technical")
            diff = interview.get("difficulty", "senior")
            topics = interview.get("selected_topics") or get_topics_for_role_and_round(role, round_type)
            
            existing_orders = {q["order"] for q in questions}
            for order in range(1, total_q + 1):
                if order not in existing_orders:
                    topic = topics[(order - 1) % len(topics)]
                    fallback = get_curated_fallback_question(role, round_type, topic, order, diff)
                    q_doc = {
                        "user_id": user_id,
                        "interview_id": interview_id,
                        "question_text": fallback["question_text"],
                        "topic": fallback["topic"],
                        "difficulty": diff,
                        "expected_concepts": fallback["expected_concepts"],
                        "evaluation_rubric": fallback["evaluation_rubric"],
                        "order": order
                    }
                    new_q = await self.question_repo.create(q_doc)
                    questions.append(new_q)
            questions.sort(key=lambda x: x["order"])

        # Load answers to attach saved state
        answers = await self.answer_repo.list_by_interview(interview_id, user_id)
        answer_map = {a["question_id"]: a for a in answers}

        for q in questions:
            saved = answer_map.get(q["id"])
            if saved:
                q["saved_answer"] = saved.get("answer_text", "")
                q["time_spent_seconds"] = saved.get("time_spent_seconds", 0)
            else:
                q["saved_answer"] = ""
                q["time_spent_seconds"] = 0

        current_idx = interview.get("current_question_index", 0)
        current_q = None
        for q in questions:
            if q.get("order") == current_idx + 1:
                current_q = q
                break
        if not current_q and questions:
            current_q = questions[0]

        interview["questions"] = questions
        interview["current_question"] = current_q
        return interview

    async def get_active_session(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves any currently unfinished in-progress session."""
        session = await self.interview_repo.get_active_session(user_id)
        if session:
            return await self.get_interview_session(session["id"], user_id)
        return None

    async def save_answer(
        self,
        interview_id: str,
        question_id: str,
        user_id: str,
        answer_text: str,
        time_spent_seconds: int = 0
    ) -> Dict[str, Any]:
        """Saves or updates a candidate's answer without triggering final evaluation."""
        interview = await self.interview_repo.get_by_id(interview_id)
        if not interview:
            raise NotFoundException(resource="Interview")
        if interview["user_id"] != user_id:
            raise ForbiddenException(detail="You do not own this interview")

        question = await self.question_repo.get_by_id(question_id)
        if not question or question["interview_id"] != interview_id:
            raise NotFoundException(resource="Question")

        # Upsert answer
        saved_answer = await self.answer_repo.upsert(
            question_id=question_id,
            interview_id=interview_id,
            user_id=user_id,
            answer_text=answer_text,
            time_spent_seconds=time_spent_seconds
        )

        # Update current question index to reflect the active question order
        order = question.get("order", 1)
        target_idx = max(0, order - 1)
        await self.interview_repo.update(interview_id, {"current_question_index": target_idx})

        return {
            "status": "saved",
            "question_id": question_id,
            "interview_id": interview_id,
            "answer_id": saved_answer.get("id"),
            "order": order
        }

    async def skip_question(self, interview_id: str, user_id: str) -> Dict[str, Any]:
        """Advances question index cleanly."""
        interview = await self.get_interview_session(interview_id, user_id)
        current_idx = interview.get("current_question_index", 0)
        total_q = interview.get("total_questions", 10)

        next_idx = min(current_idx + 1, total_q - 1)
        await self.interview_repo.update(interview_id, {"current_question_index": next_idx})
        interview["current_question_index"] = next_idx
        
        for q in interview.get("questions", []):
            if q.get("order") == next_idx + 1:
                interview["current_question"] = q
                break

        return interview

    async def end_interview(self, interview_id: str, user_id: str) -> Dict[str, Any]:
        """Marks interview status as completed and timestamps completion."""
        interview = await self.get_interview_session(interview_id, user_id)
        now = datetime.now(timezone.utc)
        await self.interview_repo.update(
            interview_id,
            {"status": "completed", "completed_at": now}
        )
        interview["status"] = "completed"
        interview["completed_at"] = now
        return interview
