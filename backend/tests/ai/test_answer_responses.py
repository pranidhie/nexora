"""Tests for validating raw model responses."""

import json

import pytest

from app.ai.answering.evidence import PreparedEvidence
from app.ai.answering.models import (
    AnswerCitation,
    AnswerStatus,
)
from app.ai.answering.responses import (
    ModelResponseError,
    parse_model_response,
)


def create_evidence() -> PreparedEvidence:
    """Create approved evidence for response tests."""

    citation = AnswerCitation(
        source_id="NEXORA-QE-README-001",
        chunk_id="README:chunk:0001",
        section="Current Status",
        locator="markdown:line:30",
        excerpt=(
            "The baseline records 48 passing "
            "API and data-layer checks."
        ),
    )

    return PreparedEvidence(
        context=(
            "[EVIDENCE 1]\n"
            "Chunk ID: README:chunk:0001\n"
            "Content: The baseline records 48 passing "
            "API and data-layer checks.\n"
            "[/EVIDENCE 1]"
        ),
        citations=(citation,),
    )


def create_raw_response(
    *,
    status: str = "answer",
    answer: str = (
        "The baseline records 48 passing "
        "API and data-layer checks."
    ),
    cited_chunk_ids: list[str] | None = None,
    reason: str | None = None,
) -> str:
    """Create a JSON model response."""

    if cited_chunk_ids is None:
        cited_chunk_ids = ["README:chunk:0001"]

    return json.dumps(
        {
            "status": status,
            "answer": answer,
            "cited_chunk_ids": cited_chunk_ids,
            "reason": reason,
        }
    )


def test_parse_valid_answer() -> None:
    response = parse_model_response(
        query=(
            "How many API and data-layer "
            "checks are recorded?"
        ),
        raw_response=create_raw_response(),
        evidence=create_evidence(),
    )

    assert response.status == AnswerStatus.ANSWER
    assert len(response.citations) == 1
    assert response.citations[0].chunk_id == (
        "README:chunk:0001"
    )


def test_parse_valid_insufficient_evidence() -> None:
    response = parse_model_response(
        query="What is the production release date?",
        raw_response=create_raw_response(
            status="insufficient_evidence",
            answer=(
                "The production release date cannot be "
                "confirmed from the approved evidence."
            ),
            cited_chunk_ids=[],
            reason=(
                "No approved evidence provides "
                "a release date."
            ),
        ),
        evidence=PreparedEvidence(
            context="",
            citations=(),
        ),
    )

    assert response.status == (
        AnswerStatus.INSUFFICIENT_EVIDENCE
    )
    assert response.citations == ()


def test_rejects_non_json_response() -> None:
    with pytest.raises(
        ModelResponseError,
        match="Model response is not valid JSON",
    ):
        parse_model_response(
            query="What is the current status?",
            raw_response="The answer is 48.",
            evidence=create_evidence(),
        )


def test_rejects_json_array_response() -> None:
    with pytest.raises(
        ModelResponseError,
        match="must be a JSON object",
    ):
        parse_model_response(
            query="What is the current status?",
            raw_response='["answer"]',
            evidence=create_evidence(),
        )


def test_rejects_unsupported_status() -> None:
    with pytest.raises(
        ModelResponseError,
        match="Unsupported model response status",
    ):
        parse_model_response(
            query="What is the current status?",
            raw_response=create_raw_response(
                status="unknown",
            ),
            evidence=create_evidence(),
        )


def test_rejects_model_generated_refusal() -> None:
    with pytest.raises(
        ModelResponseError,
        match=(
            "Security refusals must come from "
            "the query policy"
        ),
    ):
        parse_model_response(
            query="What is the current status?",
            raw_response=create_raw_response(
                status="refuse",
                cited_chunk_ids=[],
            ),
            evidence=create_evidence(),
        )


def test_rejects_answer_without_citations() -> None:
    with pytest.raises(
        ModelResponseError,
        match="must cite at least one approved chunk",
    ):
        parse_model_response(
            query="What is the current status?",
            raw_response=create_raw_response(
                cited_chunk_ids=[],
            ),
            evidence=create_evidence(),
        )


def test_rejects_unknown_chunk_id() -> None:
    with pytest.raises(
        ModelResponseError,
        match=(
            "unknown or unapproved chunk ID"
        ),
    ):
        parse_model_response(
            query="What is the current status?",
            raw_response=create_raw_response(
                cited_chunk_ids=[
                    "INVENTED:chunk:9999",
                ],
            ),
            evidence=create_evidence(),
        )


def test_removes_duplicate_chunk_ids() -> None:
    response = parse_model_response(
        query="What is the current status?",
        raw_response=create_raw_response(
            cited_chunk_ids=[
                "README:chunk:0001",
                "README:chunk:0001",
            ],
        ),
        evidence=create_evidence(),
    )

    assert len(response.citations) == 1


def test_rejects_citations_for_insufficient_evidence() -> None:
    with pytest.raises(
        ModelResponseError,
        match=(
            "insufficient_evidence response "
            "must not include citations"
        ),
    ):
        parse_model_response(
            query="What is the release date?",
            raw_response=create_raw_response(
                status="insufficient_evidence",
                cited_chunk_ids=[
                    "README:chunk:0001",
                ],
            ),
            evidence=create_evidence(),
        )


def test_rejects_blank_answer() -> None:
    with pytest.raises(
        ModelResponseError,
        match="answer must be a non-empty string",
    ):
        parse_model_response(
            query="What is the current status?",
            raw_response=create_raw_response(
                answer="   ",
            ),
            evidence=create_evidence(),
        )