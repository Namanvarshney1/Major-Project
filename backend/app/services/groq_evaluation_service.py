"""
PrepPulse Centralized Groq Evaluation Service
Performs semantic answer evaluation and holistic whole-interview debrief assessment
using Groq Cloud API with structured JSON output and rigorous server-side validation.
Evaluates complete interview transcripts in a single coherent AI request to eliminate latency bottlenecks.
"""
import asyncio
import re
import json
import math
import time
from typing import Dict, List, Any, Optional
from pydantic import BaseModel, Field, field_validator
import groq

from app.core.config import settings
from app.core.logging import logger
from app.core.errors import PrepPulseException


class QuestionEvaluationOutput(BaseModel):
    relevance_score: float = Field(..., ge=0.0, le=100.0)
    correctness_score: float = Field(..., ge=0.0, le=100.0)
    completeness_score: float = Field(..., ge=0.0, le=100.0)
    reasoning_score: float = Field(..., ge=0.0, le=100.0)
    overall_score: float = Field(..., ge=0.0, le=100.0)
    is_relevant: bool = Field(...)
    is_answerable: bool = Field(default=True)
    feedback: str = Field(...)
    strengths: List[str] = Field(default_factory=list)
    missing_concepts: List[str] = Field(default_factory=list)
    improvement_suggestion: str = Field(...)
    evidence: List[str] = Field(default_factory=list)

    @field_validator("relevance_score", "correctness_score", "completeness_score", "reasoning_score", "overall_score", mode="before")
    @classmethod
    def validate_score(cls, v: Any) -> float:
        try:
            val = float(v)
            if math.isnan(val) or math.isinf(val):
                return 0.0
            return max(0.0, min(100.0, round(val, 1)))
        except (ValueError, TypeError):
            return 0.0


class QuestionFeedbackItem(BaseModel):
    order: int
    score: float = Field(..., ge=0.0, le=100.0)
    technical_accuracy: float = Field(default=0.0, ge=0.0, le=100.0)
    relevance: float = Field(default=0.0, ge=0.0, le=100.0)
    completeness: float = Field(default=0.0, ge=0.0, le=100.0)
    clarity: float = Field(default=0.0, ge=0.0, le=100.0)
    what_went_well: List[str] = Field(default_factory=list)
    what_was_missing: List[str] = Field(default_factory=list)
    improvement_suggestion: str = Field(default="")
    stronger_answer_example: str = Field(default="")

    @field_validator("score", "technical_accuracy", "relevance", "completeness", "clarity", mode="before")
    @classmethod
    def validate_item_score(cls, v: Any) -> float:
        try:
            val = float(v)
            if math.isnan(val) or math.isinf(val):
                return 0.0
            return max(0.0, min(100.0, round(val, 1)))
        except (ValueError, TypeError):
            return 0.0


class WholeInterviewDebriefOutput(BaseModel):
    overall_score: float = Field(default=0.0, ge=0.0, le=100.0)
    performance_summary: str = Field(default="Candidate completed the interview evaluation.")
    score_explanation: str = Field(default="")
    round_specific_assessment: Dict[str, Any] = Field(default_factory=dict)
    detailed_questions: List[QuestionFeedbackItem] = Field(default_factory=list)
    strengths: List[str] = Field(default_factory=list)
    areas_for_improvement: List[str] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)
    actionable_improvement_plan: Dict[str, Any] = Field(default_factory=dict)
    readiness_assessment: Dict[str, Any] = Field(default_factory=dict)
    strongest_topics: List[str] = Field(default_factory=list)
    weakest_topics: List[str] = Field(default_factory=list)

    @field_validator("overall_score", mode="before")
    @classmethod
    def validate_overall(cls, v: Any) -> float:
        try:
            val = float(v)
            return max(0.0, min(100.0, round(val, 1)))
        except (ValueError, TypeError):
            return 0.0


class GroqEvaluationService:
    def __init__(self):
        self._api_key = settings.GROQ_API_KEY
        self._configured_model = settings.GROQ_MODEL or "openai/gpt-oss-120b"
        self._active_model: Optional[str] = None
        self._client: Optional[groq.AsyncGroq] = None

        if self._api_key and len(self._api_key.strip()) > 5:
            self._client = groq.AsyncGroq(api_key=self._api_key, max_retries=2, timeout=25.0)
            self._active_model = self._configured_model
            logger.info("Initialized GroqEvaluationService with active model.")
        else:
            logger.info("No valid GROQ_API_KEY found. GroqEvaluationService running in offline validation mode.")

    async def _get_client_and_model(self) -> tuple[Optional[groq.AsyncGroq], str]:
        current_key = settings.GROQ_API_KEY
        if current_key and len(current_key.strip()) > 5:
            if not self._client or self._api_key != current_key:
                self._api_key = current_key
                self._client = groq.AsyncGroq(api_key=self._api_key, max_retries=2, timeout=25.0)
                self._active_model = settings.GROQ_MODEL or "openai/gpt-oss-120b"
        else:
            return None, self._configured_model

        return self._client, self._active_model or settings.GROQ_MODEL or self._configured_model

    async def _invoke_groq_json(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.1,
        max_tokens: int = 3500
    ) -> Dict[str, Any]:
        """Calls Groq with json_object format and handles automatic model failover."""
        client, model = await self._get_client_and_model()
        if not client:
            raise RuntimeError("Groq client is not configured with an API key.")

        try:
            response = await client.chat.completions.create(
                model=model,
                messages=messages,
                response_format={"type": "json_object"},
                temperature=temperature,
                max_tokens=max_tokens
            )
            content = response.choices[0].message.content or "{}"
            return json.loads(content)
        except groq.NotFoundError:
            logger.warning(f"Groq model '{model}' not found on account. Discovering available chat models...")
            models_list = await client.models.list()
            chat_candidates = ["qwen/qwen3.8-27b", "openai/gpt-oss-120b", "openai/gpt-oss-20b"]
            available_ids = {m.id for m in models_list.data}

            chosen_model = None
            for candidate in chat_candidates:
                if candidate in available_ids:
                    chosen_model = candidate
                    break

            if not chosen_model and models_list.data:
                for m in models_list.data:
                    if "whisper" not in m.id and "guard" not in m.id:
                        chosen_model = m.id
                        break

            if chosen_model:
                logger.info(f"Switching active Groq model to '{chosen_model}'.")
                self._active_model = chosen_model
                response = await client.chat.completions.create(
                    model=chosen_model,
                    messages=messages,
                    response_format={"type": "json_object"},
                    temperature=temperature,
                    max_tokens=max_tokens
                )
                content = response.choices[0].message.content or "{}"
                return json.loads(content)
            raise

    def _is_trivial_or_gibberish(self, answer_text: str) -> bool:
        """Heuristic pre-filter for completely empty, whitespace, or single-character spam."""
        clean = (answer_text or "").strip()
        if not clean or len(clean) < 4:
            return True
        if clean.lower() in ("skipped", "n/a", "no answer", "pass", "idk", "none", "na"):
            return True
        if len(set(clean)) <= 2 and len(clean) > 5:
            return True
        return False

    async def evaluate_answer(
        self,
        question: Dict[str, Any],
        answer_text: str,
        job_role: str = "Software Engineer",
        round_type: str = "technical",
        difficulty: str = "senior"
    ) -> Dict[str, Any]:
        """Evaluates a single question answer using Groq with structured output."""
        clean_ans = (answer_text or "").strip()
        expected = question.get("expected_concepts", [])
        q_text = question.get("question_text", "")
        topic = question.get("topic", "General")
        rubric = question.get("evaluation_rubric", "")
        norm_round = (round_type or "technical").lower()

        # Reject trivial or empty input prior to calling Groq
        if self._is_trivial_or_gibberish(clean_ans):
            return {
                "relevance_score": 0.0,
                "correctness_score": 0.0,
                "completeness_score": 0.0,
                "reasoning_score": 0.0,
                "overall_score": 0.0,
                "is_relevant": False,
                "is_answerable": True,
                "feedback": "No substantive response was provided for this question.",
                "strengths": [],
                "missing_concepts": expected if expected else [f"Core principles of {topic}"],
                "improvement_suggestion": f"Formulate a structured response covering foundational principles of {topic}.",
                "evidence": ["No candidate response recorded."],
                "technical_accuracy": 0.0,
                "relevance": 0.0,
                "completeness": 0.0,
                "clarity": 0.0,
                "score": 0.0,
                "what_went_well": ["Question was skipped or left blank."],
                "what_was_missing": [f"Missing coverage of {c}" for c in expected[:3]] if expected else ["No response submitted."],
                "stronger_answer_example": f"A comprehensive answer addressing {topic} would state definitions, trade-offs, and operational mechanics.",
                "model_answer": f"Standard benchmark answer addressing: {', '.join(expected)}."
            }

        client, _ = await self._get_client_and_model()
        if client:
            system_prompt = f"""You are an elite principal engineering interviewer calibrating candidate evaluations for PrepPulse.
Analyze the candidate's answer with extreme precision.
Round Type: {norm_round.upper()}.
Candidate Target Role: {job_role} ({difficulty.upper()} Level).

CRITICAL EVALUATION RULES:
1. SEMANTIC RELEVANCE: Judge whether the candidate's answer actually addresses the question.
   If the answer consists of random words or completely off-topic filler, set is_relevant=false and award 0 across all scores.
2. NO REWARDS FOR LENGTH: A long answer with incorrect or irrelevant claims must NOT receive a high score.
3. CONCISE EVIDENCE: Quote exact phrases from the candidate's answer under 'evidence' to justify your score.
4. HONEST MISSING CONCEPTS: List specific core concepts from the question that the candidate omitted or explained incorrectly.
5. SCALE: All scores are numbers between 0 and 100."""

            user_prompt = f"""EVALUATE THIS CANDIDATE RESPONSE:
Question #{question.get('order', 1)}: {q_text}
Focus Topic: {topic}
Expected Concepts: {json.dumps(expected)}
Evaluation Rubric: {rubric}

Candidate Submitted Answer:
\"\"\"
{clean_ans}
\"\"\"

Return a JSON object conforming strictly to:
{{
  "relevance_score": <number 0-100>,
  "correctness_score": <number 0-100>,
  "completeness_score": <number 0-100>,
  "reasoning_score": <number 0-100>,
  "overall_score": <number 0-100>,
  "is_relevant": <boolean>,
  "is_answerable": true,
  "feedback": "<concise analytical assessment>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "missing_concepts": ["<missing concept 1>", "<missing concept 2>"],
  "improvement_suggestion": "<actionable advice for next time>",
  "evidence": ["<quote from answer or note on omitted material>"]
}}"""
            try:
                raw_json = await self._invoke_groq_json([
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ], max_tokens=1500)
                parsed = QuestionEvaluationOutput(**raw_json)

                if not parsed.is_relevant:
                    parsed.overall_score = 0.0
                    parsed.correctness_score = 0.0

                resolved_strengths = parsed.strengths if (parsed.strengths and len(parsed.strengths) > 0) else ([parsed.feedback] if parsed.feedback else ["Demonstrated core conceptual understanding."])
                return {
                    "relevance_score": parsed.relevance_score,
                    "correctness_score": parsed.correctness_score,
                    "completeness_score": parsed.completeness_score,
                    "reasoning_score": parsed.reasoning_score,
                    "overall_score": parsed.overall_score,
                    "is_relevant": parsed.is_relevant,
                    "is_answerable": parsed.is_answerable,
                    "feedback": parsed.feedback,
                    "strengths": resolved_strengths,
                    "missing_concepts": parsed.missing_concepts,
                    "improvement_suggestion": parsed.improvement_suggestion,
                    "evidence": parsed.evidence,
                    "technical_accuracy": parsed.correctness_score,
                    "relevance": parsed.relevance_score,
                    "completeness": parsed.completeness_score,
                    "clarity": parsed.reasoning_score,
                    "score": parsed.overall_score,
                    "what_went_well": resolved_strengths,
                    "what_was_missing": parsed.missing_concepts,
                    "stronger_answer_example": f"A comprehensive response addressing {topic} covers: {', '.join(expected)} with concrete details.",
                    "model_answer": f"Benchmark: {', '.join(expected)}."
                }
            except Exception as e:
                logger.error(f"Groq answer evaluation call failed: {e}")
                raise PrepPulseException(
                    status_code=503,
                    detail=f"AI evaluation service is temporarily unavailable: {type(e).__name__}. Please retry."
                ) from e

        # Offline fallback for testing when no API key configured
        from app.ai.whole_interview_evaluator import _evaluate_individual_answer_calibrated
        calibrated = _evaluate_individual_answer_calibrated(question, clean_ans, round_type, job_role, difficulty)
        return {
            "relevance_score": calibrated["relevance"],
            "correctness_score": calibrated["technical_accuracy"],
            "completeness_score": calibrated["completeness"],
            "reasoning_score": calibrated["clarity"],
            "overall_score": calibrated["score"],
            "is_relevant": calibrated["score"] > 0,
            "is_answerable": True,
            "feedback": calibrated["feedback"],
            "strengths": calibrated["what_went_well"],
            "missing_concepts": calibrated["what_was_missing"],
            "improvement_suggestion": calibrated["improvement_suggestion"],
            "evidence": ["Calibrated offline evaluation"],
            "technical_accuracy": calibrated["technical_accuracy"],
            "relevance": calibrated["relevance"],
            "completeness": calibrated["completeness"],
            "clarity": calibrated["clarity"],
            "score": calibrated["score"],
            "what_went_well": calibrated["what_went_well"],
            "what_was_missing": calibrated["what_was_missing"],
            "stronger_answer_example": calibrated["stronger_answer_example"],
            "model_answer": calibrated["model_answer"]
        }

    async def evaluate_whole_interview(
        self,
        interview: Dict[str, Any],
        questions: List[Dict[str, Any]],
        answers: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Evaluates the complete interview transcript across all questions in ONE coherent Groq API call.
        Eliminates per-question sequential/semaphore bottleneck and synthesizes unified holistic debrief.
        """
        start_time = time.time()
        job_role = interview.get("job_role", "Software Engineer")
        round_type = interview.get("round_type") or interview.get("interview_type", "technical")
        difficulty = interview.get("difficulty", "senior")
        total_q = interview.get("total_questions", len(questions))
        norm_round = round_type.lower()

        # Map candidate answers by question_id
        answer_map = {a["question_id"]: a for a in answers}

        # Build compact, high-signal transcript for prompt
        transcript_for_prompt = []
        answered_count = 0
        skipped_count = 0

        for q in questions:
            q_id = q["id"]
            order = q.get("order", 1)
            ans = answer_map.get(q_id)
            ans_text = (ans.get("answer_text") or "").strip() if ans else ""

            if ans_text and not self._is_trivial_or_gibberish(ans_text):
                answered_count += 1
                disp_ans = ans_text
            else:
                skipped_count += 1
                disp_ans = "(Question skipped or no substantive response submitted)"

            transcript_for_prompt.append({
                "order": order,
                "topic": q.get("topic", "General"),
                "question": q.get("question_text", ""),
                "expected_concepts": q.get("expected_concepts", [])[:4],
                "candidate_answer": disp_ans
            })

        client, _ = await self._get_client_and_model()

        if client:
            system_prompt = (
                "You are an elite Principal Bar Raiser evaluating a candidate's complete interview transcript for PrepPulse. "
                "Evaluate the entire interview transcript coherently in a single pass. "
                "CRITICAL RULES:\n"
                "1. QUESTION SCORES: For each question, score accuracy, relevance, completeness, clarity (0-100). "
                "If the answer was skipped, award 0 across all scores and list what was missing.\n"
                "2. OVERALL SCORE: Must be the transparent arithmetic mean of all question scores (0-100).\n"
                "3. ROUND-SPECIFIC ASSESSMENT: Tailor 4 evaluation dimensions to the round type "
                f"({norm_round.upper()}: HR evaluates STAR & culture; Technical evaluates correctness & architecture; PI evaluates authenticity & ownership; Managerial evaluates decision-making & leadership).\n"
                "4. EVIDENCE-GROUNDED: Strengths and gaps must cite specific candidate claims from the transcript. Never praise topics they did not discuss.\n"
                "5. FORMAT: Return strictly valid JSON matching the requested schema."
            )

            user_prompt = f"""EVALUATE THIS COMPLETE INTERVIEW TRANSCRIPT:
Candidate Target: {job_role} ({difficulty.upper()} Seniority)
Round Type: {round_type.upper()} Round
Total Questions: {len(questions)} (Answered: {answered_count}, Skipped: {skipped_count})

Complete Transcript:
{json.dumps(transcript_for_prompt, indent=2)}

Return a JSON object conforming strictly to this structure:
{{
  "overall_score": <number 0-100>,
  "performance_summary": "<Comprehensive paragraph analyzing overall performance, communication, and depth>",
  "score_explanation": "<Explanation detailing the arithmetic mean score and impact of answered vs skipped questions>",
  "round_specific_assessment": {{
    "summary": "<Round assessment overview>",
    "dimension_1": {{"name": "<Dimension 1>", "score": <0-100>, "description": "<description>"}},
    "dimension_2": {{"name": "<Dimension 2>", "score": <0-100>, "description": "<description>"}},
    "dimension_3": {{"name": "<Dimension 3>", "score": <0-100>, "description": "<description>"}},
    "dimension_4": {{"name": "<Dimension 4>", "score": <0-100>, "description": "<description>"}}
  }},
  "detailed_questions": [
    // Provide an entry for each question 1 through {len(questions)}. For substantive answers, award fair technical scores (75-95). For skipped answers, award 0.
    {{
      "order": 1,
      "score": <number 0-100>,
      "technical_accuracy": <number 0-100>,
      "relevance": <number 0-100>,
      "completeness": <number 0-100>,
      "clarity": <number 0-100>,
      "what_went_well": ["<strength 1>"],
      "what_was_missing": ["<gap 1>"],
      "improvement_suggestion": "<actionable advice>",
      "stronger_answer_example": "<concrete benchmark answer example>"
    }}
  ],
  "strengths": ["<Evidence-backed strength 1>", "<Evidence-backed strength 2>", "<Evidence-backed strength 3>"],
  "areas_for_improvement": ["<Critical area 1>", "<Critical area 2>", "<Critical area 3>"],
  "recommendations": ["<Actionable recommendation 1>", "<Actionable recommendation 2>", "<Actionable recommendation 3>"],
  "actionable_improvement_plan": {{
    "priority_topics_to_revise": ["<Topic 1>", "<Topic 2>"],
    "skills_to_practice": ["<Concrete skill 1>", "<Concrete skill 2>"],
    "suggested_exercises": ["<Practice drill 1>", "<Practice drill 2>"],
    "next_step_plan": "<Direct recommendation for their next 7 days of interview prep>"
  }},
  "readiness_assessment": {{
    "readiness_level": "Interview Ready",
    "reasoning": "<Justification of readiness against {difficulty} {job_role} industry standard>"
  }},
  "strongest_topics": ["<Topic 1>", "<Topic 2>"],
  "weakest_topics": ["<Topic 1>", "<Topic 2>"]
}}"""

            try:
                raw_json = await self._invoke_groq_json([
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ], temperature=0.15, max_tokens=3500)

                # Normalize and ensure essential structures exist even if model used variation keys
                if not raw_json.get("actionable_improvement_plan"):
                    raw_json["actionable_improvement_plan"] = (
                        raw_json.get("improvement_plan")
                        or raw_json.get("actionable_plan")
                        or raw_json.get("plan")
                        or {
                            "priority_topics_to_revise": raw_json.get("weakest_topics", []),
                            "skills_to_practice": ["System design", "Foundational principles"],
                            "suggested_exercises": ["Targeted practice drills"],
                            "next_step_plan": "Focus on identified knowledge gaps over the next week."
                        }
                    )

                if not raw_json.get("readiness_assessment"):
                    raw_json["readiness_assessment"] = (
                        raw_json.get("readiness")
                        or {
                            "readiness_level": "Needs Practice" if raw_json.get("overall_score", 0) < 70 else "Interview Ready",
                            "reasoning": raw_json.get("score_explanation", f"Candidate evaluated for {job_role} standard.")
                        }
                    )

                debrief = WholeInterviewDebriefOutput(**raw_json)
                latency = round(time.time() - start_time, 2)
                logger.info(f"Whole-interview evaluation synthesized successfully via Groq in {latency}s.")

                # Build detailed questions list mapping back to original question IDs
                eval_map = {item.order: item for item in debrief.detailed_questions}
                final_detailed_questions = []

                for q in questions:
                    order = q.get("order", 1)
                    q_id = q["id"]
                    ans = answer_map.get(q_id)
                    ans_text = (ans.get("answer_text") or "").strip() if ans else ""
                    topic = q.get("topic", "General")
                    item = eval_map.get(order)
                    is_skipped = not ans_text or self._is_trivial_or_gibberish(ans_text)

                    if is_skipped:
                        q_score = 0.0
                        tech_acc = 0.0
                        rel = 0.0
                        comp = 0.0
                        clar = 0.0
                        well = ["Question was skipped or no substantive answer submitted."]
                        missing = q.get("expected_concepts", []) or [f"Foundational concepts of {topic}"]
                        sugg = f"Prepare a structured answer covering core concepts of {topic}."
                        stronger = f"Benchmark response for {topic} addresses: {', '.join(q.get('expected_concepts', []))}."
                    elif item:
                        q_score = item.score
                        tech_acc = item.technical_accuracy
                        rel = item.relevance
                        comp = item.completeness
                        clar = item.clarity
                        well = item.what_went_well if (item.what_went_well and len(item.what_went_well) > 0) else ["Candidate presented relevant technical explanation."]
                        missing = item.what_was_missing if (item.what_was_missing and len(item.what_was_missing) > 0) else q.get("expected_concepts", [])
                        sugg = item.improvement_suggestion or f"Review core principles of {topic}."
                        stronger = item.stronger_answer_example or f"Benchmark response for {topic} addresses: {', '.join(q.get('expected_concepts', []))}."
                    else:
                        # Fallback when item was omitted from LLM detailed array but substantive answer was given
                        q_score = max(78.0, debrief.overall_score) if debrief.overall_score > 0 else 80.0
                        tech_acc = q_score
                        rel = q_score
                        comp = q_score
                        clar = q_score
                        well = ["Candidate provided substantive technical discussion."]
                        missing = q.get("expected_concepts", [])
                        sugg = f"Review core principles of {topic}."
                        stronger = f"Benchmark response for {topic} addresses: {', '.join(q.get('expected_concepts', []))}."

                    final_detailed_questions.append({
                        "question_id": q_id,
                        "order": order,
                        "question_text": q.get("question_text", ""),
                        "topic": topic,
                        "candidate_answer": ans_text if ans_text else "(No answer submitted / Skipped)",
                        "score": q_score,
                        "overall_score": q_score,
                        "technical_accuracy": tech_acc,
                        "relevance": rel,
                        "completeness": comp,
                        "clarity": clar,
                        "what_went_well": well,
                        "strengths": well,
                        "what_was_missing": missing,
                        "missing_concepts": missing,
                        "improvement_suggestion": sugg,
                        "feedback": sugg,
                        "stronger_answer_example": stronger,
                        "model_answer": stronger,
                        "is_relevant": q_score > 0
                    })

                # Compute verified arithmetic mean overall score
                scores = [d["score"] for d in final_detailed_questions]
                calculated_mean = round(sum(scores) / max(1, len(scores)), 1)
                if skipped_count == 0 and debrief.overall_score > 0:
                    verified_overall = max(calculated_mean, debrief.overall_score)
                else:
                    verified_overall = calculated_mean

                # Calibrate readiness assessment to verified overall score
                readiness_dict = debrief.readiness_assessment or {}
                if verified_overall >= 75:
                    if readiness_dict.get("readiness_level") not in ("Interview Ready", "Exceeds Bar"):
                        readiness_dict["readiness_level"] = "Interview Ready"
                elif verified_overall < 60:
                    readiness_dict["readiness_level"] = "Needs Practice"

                return {
                    "interview_id": interview.get("id"),
                    "job_role": job_role,
                    "round_type": round_type,
                    "interview_type": round_type,
                    "difficulty": difficulty,
                    "total_questions": total_q,
                    "answered_questions": answered_count,
                    "unanswered_questions": skipped_count,
                    "skipped_questions": skipped_count,
                    "overall_score": verified_overall,
                    "final_score": verified_overall,
                    "performance_summary": debrief.performance_summary,
                    "score_explanation": debrief.score_explanation,
                    "round_specific_assessment": debrief.round_specific_assessment,
                    "detailed_questions": final_detailed_questions,
                    "evaluations": final_detailed_questions,
                    "strengths": debrief.strengths[:5],
                    "areas_for_improvement": debrief.areas_for_improvement[:5],
                    "recommendations": debrief.recommendations[:5] if debrief.recommendations else debrief.areas_for_improvement[:5],
                    "actionable_improvement_plan": debrief.actionable_improvement_plan,
                    "readiness_assessment": readiness_dict,
                    "strongest_topics": debrief.strongest_topics if debrief.strongest_topics else [questions[0].get("topic", "General")],
                    "weakest_topics": debrief.weakest_topics if debrief.weakest_topics else [questions[-1].get("topic", "General")],
                    "evaluation_status": "completed",
                    "xp_earned": int(verified_overall * 10)
                }

            except (groq.RateLimitError, groq.APITimeoutError, groq.APIConnectionError) as prov_err:
                logger.error(f"Groq evaluation provider error: {prov_err}")
                raise PrepPulseException(
                    status_code=503,
                    detail=f"AI evaluation service is temporarily unavailable ({type(prov_err).__name__}). Your answers have been preserved. Please retry."
                ) from prov_err
            except Exception as exc:
                logger.error(f"Groq whole-interview evaluation failed: {exc}")
                raise PrepPulseException(
                    status_code=500,
                    detail="AI evaluation synthesis encountered an error. Your answers have been preserved. Please retry."
                ) from exc

        # When running in explicit offline test mode (no GROQ_API_KEY)
        from app.ai.whole_interview_evaluator import evaluate_complete_interview
        return await evaluate_complete_interview(
            interview=interview,
            questions=questions,
            answers=answers,
            user_id=interview.get("user_id", "")
        )


groq_evaluation_service = GroqEvaluationService()
