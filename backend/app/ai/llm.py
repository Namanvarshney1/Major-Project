"""
PrepPulse LLM Provider Interface
Encapsulates Groq-hosted inference via official Groq SDK with structured JSON output,
dynamic model resolution, configurable token budgets, and error resilience.
"""
import time
import json
from typing import Optional, Dict, Any, Type, TypeVar
from pydantic import BaseModel
import groq

from app.core.config import settings
from app.core.logging import logger

T = TypeVar("T", bound=BaseModel)


class LLMClient:
    def __init__(self):
        self._api_key = settings.GROQ_API_KEY
        self._configured_model = settings.GROQ_MODEL or "openai/gpt-oss-120b"
        self._active_model: Optional[str] = None
        self._client: Optional[groq.AsyncGroq] = None

        if self._api_key and len(self._api_key.strip()) > 5:
            self._client = groq.AsyncGroq(api_key=self._api_key, max_retries=2, timeout=25.0)
            self._active_model = self._configured_model
            logger.info(f"Initialized Groq LLMClient with model: {self._configured_model}.")
        else:
            logger.info("No valid GROQ_API_KEY detected. Running in deterministic offline mode.")

    async def _get_client_and_model(self) -> tuple[Optional[groq.AsyncGroq], str]:
        # Refresh if settings changed dynamically
        current_key = settings.GROQ_API_KEY
        if current_key and len(current_key.strip()) > 5:
            if not self._client or self._api_key != current_key:
                self._api_key = current_key
                self._client = groq.AsyncGroq(api_key=self._api_key, max_retries=2, timeout=25.0)
                self._active_model = settings.GROQ_MODEL or "openai/gpt-oss-120b"
        else:
            return None, self._configured_model

        return self._client, self._active_model or settings.GROQ_MODEL or self._configured_model

    async def generate_structured(
        self,
        system_prompt: str,
        user_prompt: str,
        schema: Type[T],
        fallback_data: Optional[T] = None,
        max_tokens: int = 3500,
        temperature: float = 0.2
    ) -> T:
        """
        Invokes Groq with structured JSON output and schema validation.
        Supports larger token budgets (default 3500) so rich question batches and reports are never truncated.
        """
        start_time = time.time()
        client, model = await self._get_client_and_model()

        if client:
            async def _call_model(target_model: str):
                resp = await client.chat.completions.create(
                    model=target_model,
                    messages=[
                        {"role": "system", "content": f"{system_prompt}\nOutput valid JSON strictly adhering to the schema."},
                        {"role": "user", "content": user_prompt}
                    ],
                    response_format={"type": "json_object"},
                    temperature=temperature,
                    max_tokens=max_tokens
                )
                content = resp.choices[0].message.content or "{}"
                return json.loads(content)

            try:
                raw_json = await _call_model(model)
                latency = round(time.time() - start_time, 2)
                logger.info(f"Groq structured response received in {latency}s for {schema.__name__} using {model}.")
                return schema(**raw_json)
            except groq.NotFoundError:
                logger.warning(f"Model '{model}' not found on Groq account. Resolving available models...")
                try:
                    models_list = await client.models.list()
                    available_ids = {m.id for m in models_list.data}
                    for candidate in ["qwen/qwen3.8-27b", "openai/gpt-oss-120b", "openai/gpt-oss-20b"]:
                        if candidate in available_ids:
                            self._active_model = candidate
                            break
                    if not self._active_model and models_list.data:
                        for m in models_list.data:
                            if "whisper" not in m.id and "guard" not in m.id:
                                self._active_model = m.id
                                break

                    if self._active_model and self._active_model != model:
                        raw_json = await _call_model(self._active_model)
                        latency = round(time.time() - start_time, 2)
                        logger.info(f"Groq structured response received via {self._active_model} in {latency}s.")
                        return schema(**raw_json)
                except Exception as inner_exc:
                    logger.warning(f"Groq model resolution or inference failed: {inner_exc}")
                    if fallback_data is None:
                        raise
            except (groq.RateLimitError, groq.APITimeoutError, groq.APIConnectionError) as prov_err:
                logger.error(f"Groq provider error ({type(prov_err).__name__}): {prov_err}")
                if fallback_data is None:
                    raise
            except Exception as exc:
                logger.warning(f"Groq structured generation failed ({exc}).")
                if fallback_data is None:
                    raise

        # If fallback_data is provided and fallback is permitted
        if fallback_data is not None:
            latency = round(time.time() - start_time, 2)
            logger.info(f"Using fallback data for {schema.__name__} in {latency}s.")
            return fallback_data

        raise RuntimeError("Groq LLM service is unavailable and no fallback was permitted.")


llm_client = LLMClient()
