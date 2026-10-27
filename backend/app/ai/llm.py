"""
PrepPulse LLM Provider Interface
Encapsulates Groq-hosted Llama integration via LangChain with robust fallback handling.
"""
import time
import json
from typing import Optional, Dict, Any, Type, TypeVar
from pydantic import BaseModel
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_groq import ChatGroq

from app.core.config import settings
from app.core.logging import logger
from app.ai.output_schemas import QuestionGenOutput, AnswerEvalOutput

T = TypeVar("T", bound=BaseModel)


class LLMClient:
    def __init__(self):
        self.model_name = settings.GROQ_MODEL
        self.api_key = settings.GROQ_API_KEY
        self._groq_client = None

        if self.api_key and len(self.api_key.strip()) > 5:
            try:
                self._groq_client = ChatGroq(
                    model=self.model_name,
                    api_key=self.api_key,
                    temperature=0.2,
                    timeout=30.0,
                    max_retries=2
                )
                logger.info(f"Initialized ChatGroq with model '{self.model_name}'.")
            except Exception as e:
                logger.warning(f"Could not initialize ChatGroq: {e}. Using deterministic engine.")
        else:
            logger.info("No GROQ_API_KEY detected in environment. Using high-signal deterministic engine.")

    async def generate_structured(
        self,
        system_prompt: str,
        user_prompt: str,
        schema: Type[T],
        fallback_data: T
    ) -> T:
        """Invokes Groq Llama with structured output validation, or uses high-fidelity fallback."""
        start_time = time.time()

        if self._groq_client:
            try:
                structured_llm = self._groq_client.with_structured_output(schema)
                messages = [
                    SystemMessage(content=system_prompt),
                    HumanMessage(content=user_prompt)
                ]
                response = await structured_llm.ainvoke(messages)
                latency = round(time.time() - start_time, 2)
                logger.info(f"Groq structured response received in {latency}s for {schema.__name__}.")
                if isinstance(response, schema):
                    return response
                elif isinstance(response, dict):
                    return schema(**response)
            except Exception as exc:
                logger.warning(f"Groq inference failed or timed out ({exc}). Engaging calibrated fallback engine.")

        # Fallback path guarantees zero downtime for students/examiners
        latency = round(time.time() - start_time, 2)
        logger.info(f"Generated calibrated {schema.__name__} in {latency}s via fallback engine.")
        return fallback_data


llm_client = LLMClient()
