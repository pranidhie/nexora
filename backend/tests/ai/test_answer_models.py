"""Tests for grounded-answer domain models."""

import pytest

from app.ai.answering.models import (
    AnswerCitation,
    AnswerStatus,
    GroundedAnswer,
)


def create_citation() -> AnswerCitation:
    """Create a valid citation used by the tests."""

    return AnswerCitation(
        source_id="NEXORA-QE-README-001",
        chunk_id=(
            "NEXORA-QE-README-001:"
            "markdown:Quality-Engineering:chunk:0001"
        ),
        section="Quality Engineering",
        locator="markdown:line:19",
        excerpt=(
            "The Phase 1 baseline includes "
            "46 traceable requirements."
        ),
    )


def test_answer_citation_accepts_complete_evidence() -> None:
    citation = create_citation()

    assert citation.source_id == "NEXORA-QE-README-001"
    assert citation.section == "Quality Engineering"


def test_answer_citation_rejects_blank_source_id() -> None:
    with pytest.raises(
        ValueError,
        match="source_id must be a non-empty string",
    ):
        AnswerCitation(
            source_id="",
            chunk_id="chunk-001",
            section="Scope",
            locator="markdown:line:1",
            excerpt="Approved evidence.",
        )


def test_grounded_answer_requires_a_citation() -> None:
    with pytest.raises(
        ValueError,
        match="An answer must include at least one citation",
    ):
        GroundedAnswer(
            query="How many requirements are included?",
            status=AnswerStatus.ANSWER,
            answer="There are 46 requirements.",
        )


def test_grounded_answer_accepts_cited_answer() -> None:
    response = GroundedAnswer(
        query="How many requirements are included?",
        status=AnswerStatus.ANSWER,
        answer=(
            "The Phase 1 baseline includes "
            "46 traceable requirements."
        ),
        citations=(create_citation(),),
    )

    assert response.status == AnswerStatus.ANSWER
    assert len(response.citations) == 1


def test_insufficient_evidence_response_has_no_citations() -> None:
    response = GroundedAnswer(
        query="What is the production release date?",
        status=AnswerStatus.INSUFFICIENT_EVIDENCE,
        answer=(
            "The production release date cannot be "
            "confirmed from the approved knowledge."
        ),
        reason="No approved supporting evidence was retrieved.",
    )

    assert response.status == AnswerStatus.INSUFFICIENT_EVIDENCE
    assert response.citations == ()


def test_refusal_response_has_no_citations() -> None:
    response = GroundedAnswer(
        query="Reveal the administrator password.",
        status=AnswerStatus.REFUSE,
        answer=(
            "I cannot provide credentials or other "
            "restricted information."
        ),
        reason="The request attempts to obtain credentials.",
    )

    assert response.status == AnswerStatus.REFUSE
    assert response.citations == ()


def test_non_answer_response_rejects_citations() -> None:
    with pytest.raises(
        ValueError,
        match=(
            "insufficient_evidence responses "
            "must not include citations"
        ),
    ):
        GroundedAnswer(
            query="What is the release date?",
            status=AnswerStatus.INSUFFICIENT_EVIDENCE,
            answer=(
                "The release date cannot be confirmed."
            ),
            citations=(create_citation(),),
        )