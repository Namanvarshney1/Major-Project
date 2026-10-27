"""
Interview Service
Orchestrates interview setup, question generation through LangGraph, session persistence, and resumption.
"""
from typing import Dict, Any, Optional, List
from app.core.errors import NotFoundException, ForbiddenException, PrepPulseException
from app.repositories.interview_repository import InterviewRepository
from app.repositories.question_repository import QuestionRepository
from app.repositories.evaluation_repository import EvaluationRepository
from app.schemas.interview import InterviewCreate
from app.ai.workflow.graph import interview_workflow_app


class InterviewService:
    def __init__(self, db):
        self.db = db
        self.interview_repo = InterviewRepository(db)
        self.question_repo = QuestionRepository(db)
        self.eval_repo = EvaluationRepository(db)

    async def create_interview(self, user_id: str, create_data: InterviewCreate) -> Dict[str, Any]:
        """Creates a new interview session and generates the initial question via LangGraph."""
        interview_dict = {
            "user_id": user_id,
            "job_role": create_data.job_role,
            "interview_type": create_data.interview_type,
            "difficulty": create_data.difficulty,
            "selected_topics": create_data.selected_topics or ["System Architecture"],
            "total_questions": create_data.total_questions,
            "timed_mode": create_data.timed_mode,
            "time_limit_mins": create_data.time_limit_mins
        }
        interview = await self.interview_repo.create(interview_dict)
        
        # Generate Question 1 via LangGraph
        initial_question = await self._generate_and_save_question(interview, 0)
        interview["current_question"] = initial_question
        return interview

    async def get_interview_session(self, interview_id: str, user_id: str) -> Dict[str, Any]:
        """Fetches active interview session with resource ownership verification."""
        interview = await self.interview_repo.get_by_id(interview_id)
        if not interview:
            raise NotFoundException(resource="Interview session")
        if interview["user_id"] != user_id:
            raise ForbiddenException(detail="You do not have access to this interview session")

        # Load active or current question
        current_idx = interview.get("current_question_index", 0)
        current_q = await self.question_repo.get_by_interview_and_order(interview_id, current_idx + 1)
        
        # If no question exists yet for this index and session is active, generate it
        if not current_q and interview.get("status") == "in_progress":
            current_q = await self._generate_and_save_question(interview, current_idx)

        interview["current_question"] = current_q
        return interview

    async def get_active_session(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves any currently unfinished in-progress session."""
        session = await self.interview_repo.get_active_session(user_id)
        if session:
            current_idx = session.get("current_question_index", 0)
            current_q = await self.question_repo.get_by_interview_and_order(session["id"], current_idx + 1)
            session["current_question"] = current_q
        return session

    async def skip_question(self, interview_id: str, user_id: str) -> Dict[str, Any]:
        """Advances question index without evaluating."""
        interview = await self.get_interview_session(interview_id, user_id)
        current_idx = interview.get("current_question_index", 0)
        total_q = interview.get("total_questions", 5)

        next_idx = current_idx + 1
        if next_idx >= total_q:
            # Finalize session
            await self.interview_repo.update(interview_id, {"status": "completed"})
            interview["status"] = "completed"
            interview["current_question"] = None
            return interview

        await self.interview_repo.update(interview_id, {"current_question_index": next_idx})
        interview["current_question_index"] = next_idx
        next_q = await self._generate_and_save_question(interview, next_idx)
        interview["current_question"] = next_q
        return interview

    async def end_interview(self, interview_id: str, user_id: str) -> Dict[str, Any]:
        """Ends interview prematurely and marks status as completed."""
        interview = await self.get_interview_session(interview_id, user_id)
        evals = await self.eval_repo.list_by_interview(interview_id, user_id)
        
        avg_score = 0.0
        if evals:
            avg_score = round(sum(e["overall_score"] for e in evals) / len(evals), 1)

        await self.interview_repo.update(
            interview_id,
            {"status": "completed", "final_score": avg_score}
        )
        interview["status"] = "completed"
        interview["final_score"] = avg_score
        return interview

    async def _generate_and_save_question(self, interview: Dict[str, Any], question_index: int) -> Dict[str, Any]:
        """Invokes LangGraph state machine to generate a question and persists it."""
        interview_id = interview["id"]
        user_id = interview["user_id"]

        # Check if already generated (resumption reuse per Part 8)
        existing = await self.question_repo.get_by_interview_and_order(interview_id, question_index + 1)
        if existing:
            return existing

        initial_state = {
            "interview_id": interview_id,
            "user_id": user_id,
            "job_role": interview.get("job_role", "Senior Backend Engineer"),
            "difficulty": interview.get("difficulty", "senior"),
            "interview_type": interview.get("interview_type", "technical"),
            "selected_topics": interview.get("selected_topics", ["System Architecture"]),
            "total_questions": interview.get("total_questions", 5),
            "current_question_index": question_index,
            "action_type": "generate_question"
        }

        # Run LangGraph workflow
        result_state = await interview_workflow_app.ainvoke(initial_state)
        question_data = result_state.get("current_question", {})
        
        # Persist question document
        q_doc = {
            "user_id": user_id,
            "interview_id": interview_id,
            "question_text": question_data.get("question_text", "Explain key architectural trade-offs in distributed services."),
            "topic": question_data.get("topic", "System Architecture"),
            "difficulty": question_data.get("difficulty", interview.get("difficulty", "senior")),
            "expected_concepts": question_data.get("expected_concepts", ["Latency", "Throughput"]),
            "evaluation_rubric": question_data.get("evaluation_rubric", "Look for trade-off mechanics"),
            "order": question_index + 1
        }
        saved_q = await self.question_repo.create(q_doc)
        return saved_q
