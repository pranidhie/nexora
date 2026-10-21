"""Validate and convert raw LLM responses into grounded answers."""

from __future__ import annotations

import json
from typing import Any

from app.ai.answering.evidence import PreparedEvidence
from app.ai.answering.models import (
    AnswerCitation,
    AnswerStatus,
    GroundedAnswer,
)


class ModelResponseError(ValueError):
    """Raised when an LLM response violates the answer contract."""


def _require_string(
    value: Any,
    field_name: str,
) -> str:
    """Validate and normalise a required string."""

    if not isinstance(value, str) or not value.strip():
        raise ModelResponseError(
            f"{field_name} must be a non-empty string."
        )

    return value.strip()


def _require_chunk_ids(
    value: Any,
) -> tuple[str, ...]:
    """Validate cited chunk IDs returned by the model."""

    if not isinstance(value, list):
        raise ModelResponseError(
            "cited_chunk_ids must be an array."
        )

    chunk_ids: list[str] = []

    for index, item in enumerate(value):
        chunk_id = _require_string(
            item,
            f"cited_chunk_ids[{index}]",
        )

        if chunk_id not in chunk_ids:
            chunk_ids.append(chunk_id)

    return tuple(chunk_ids)


def _parse_json_object(
    raw_response: str,
) -> dict[str, Any]:
    """Parse the raw model response as one JSON object."""

    if (
        not isinstance(raw_response, str)
        or not raw_response.strip()
    ):
        raise ModelResponseError(
            "Model response must be a non-empty string."
        )

    try:
        parsed_response = json.loads(
            raw_response
        )
    except json.JSONDecodeError as error:
        raise ModelResponseError(
            f"Model response is not valid JSON: {error}"
        ) from error

    if not isinstance(parsed_response, dict):
        raise ModelResponseError(
            "Model response must be a JSON object."
        )

    return parsed_response


def _resolve_citations(
    cited_chunk_ids: tuple[str, ...],
    evidence: PreparedEvidence,
) -> tuple[AnswerCitation, ...]:
    """Resolve model citations against approved evidence."""

    citations_by_chunk_id = {
        citation.chunk_id: citation
        for citation in evidence.citations
    }

    unknown_chunk_ids = tuple(
        chunk_id
        for chunk_id in cited_chunk_ids
        if chunk_id not in citations_by_chunk_id
    )

    if unknown_chunk_ids:
        raise ModelResponseError(
            "Model cited an unknown or unapproved chunk ID: "
            f"{unknown_chunk_ids[0]}"
        )

    return tuple(
        citations_by_chunk_id[chunk_id]
        for chunk_id in cited_chunk_ids
    )


def parse_model_response(
    *,
    query: str,
    raw_response: str,
    evidence: PreparedEvidence,
) -> GroundedAnswer:
    """Validate an LLM response and build a grounded answer."""

    parsed_response = _parse_json_object(
        raw_response
    )

    raw_status = _require_string(
        parsed_response.get("status"),
        "status",
    )

    try:
        status = AnswerStatus(raw_status)
    except ValueError as error:
        raise ModelResponseError(
            f"Unsupported model response status: {raw_status}"
        ) from error

    if status == AnswerStatus.REFUSE:
        raise ModelResponseError(
            "The model cannot independently return REFUSE. "
            "Security refusals must come from the query policy."
        )

    answer = _require_string(
        parsed_response.get("answer"),
        "answer",
    )

    cited_chunk_ids = _require_chunk_ids(
        parsed_response.get("cited_chunk_ids")
    )

    raw_reason = parsed_response.get("reason")

    if raw_reason is not None:
        reason = _require_string(
            raw_reason,
            "reason",
        )
    else:
        reason = None

    if status == AnswerStatus.ANSWER:
        if not cited_chunk_ids:
            raise ModelResponseError(
                "An answer response must cite at least "
                "one approved chunk."
            )

        citations = _resolve_citations(
            cited_chunk_ids,
            evidence,
        )

        return GroundedAnswer(
            query=query,
            status=status,
            answer=answer,
            citations=citations,
            reason=reason,
        )

    if cited_chunk_ids:
        raise ModelResponseError(
            "An insufficient_evidence response must not "
            "include citations."
        )

    return GroundedAnswer(
        query=query,
        status=AnswerStatus.INSUFFICIENT_EVIDENCE,
        answer=answer,
        citations=(),
        reason=reason,
    )