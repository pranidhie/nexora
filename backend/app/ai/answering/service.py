"""Orchestrate the complete grounded-answer workflow."""

from __future__ import annotations

from app.ai.answering.evidence import prepare_evidence
from app.ai.answering.models import (
    AnswerStatus,
    GroundedAnswer,
)
from app.ai.answering.policy import (
    assess_query_policy,
    build_policy_refusal,
)
from app.ai.answering.prompts import build_grounded_prompt
from app.ai.answering.provider import AnswerProvider
from app.ai.answering.responses import parse_model_response
from app.ai.retrieval.lexical import (
    MAX_TOP_K,
    LexicalRetriever,
)


DEFAULT_RETRIEVAL_TOP_K = 5


class GroundedAnswerService:
    """Answer questions using only approved NEXORA evidence."""

    def __init__(
        self,
        *,
        retriever: LexicalRetriever,
        provider: AnswerProvider,
        allowed_source_ids: tuple[str, ...],
        top_k: int = DEFAULT_RETRIEVAL_TOP_K,
    ) -> None:
        if not allowed_source_ids:
            raise ValueError(
                "At least one allowed source ID is required."
            )

        if top_k < 1 or top_k > MAX_TOP_K:
            raise ValueError(
                f"top_k must be between 1 and {MAX_TOP_K}."
            )

        self._retriever = retriever
        self._provider = provider
        self._allowed_source_ids = allowed_source_ids
        self._top_k = top_k

    async def answer(
        self,
        query: str,
    ) -> GroundedAnswer:
        """Run policy, retrieval, generation, and validation."""

        policy_result = assess_query_policy(query)

        if not policy_result.is_allowed:
            return build_policy_refusal(
                query,
                policy_result,
            )

        retrieval_results = self._retriever.search(
            query,
            top_k=MAX_TOP_K,
        )

        evidence = prepare_evidence(
            retrieval_results,
            allowed_source_ids=(
                self._allowed_source_ids
            ),
            max_results=self._top_k,
        )

        if not evidence.has_evidence:
            return GroundedAnswer(
                query=query.strip(),
                status=(
                    AnswerStatus.INSUFFICIENT_EVIDENCE
                ),
                answer=(
                    "The answer cannot be confirmed from "
                    "the approved NEXORA knowledge."
                ),
                citations=(),
                reason=(
                    "No approved supporting evidence "
                    "was retrieved."
                ),
            )

        prompt = build_grounded_prompt(
            query,
            evidence,
        )

        raw_response = await self._provider.generate(
            system_prompt=prompt.system_prompt,
            user_prompt=prompt.user_prompt,
        )

        return parse_model_response(
            query=query.strip(),
            raw_response=raw_response,
            evidence=evidence,
        )