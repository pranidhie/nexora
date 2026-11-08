"""Tests for grounded-answer evidence preparation."""

import pytest

from app.ai.answering.evidence import (
    EvidencePreparationError,
    prepare_evidence,
)
from app.ai.ingestion.models import KnowledgeChunk
from app.ai.retrieval.lexical import RetrievalResult


def create_chunk(
    *,
    chunk_id: str = "README:chunk:0001",
    source_id: str = "NEXORA-QE-README-001",
    classification: str = "PUBLIC_SANITISED",
    text: str = (
        "The Phase 1 test design baseline includes "
        "46 traceable requirements."
    ),
) -> KnowledgeChunk:
    """Create a representative knowledge chunk."""

    return KnowledgeChunk(
        chunk_id=chunk_id,
        source_id=source_id,
        document_title=(
            "NEXORA Phase 1 Procurement "
            "Quality Engineering"
        ),
        relative_path=(
            "docs/phase-1-procurement/README.md"
        ),
        format="markdown",
        document_type="quality-engineering-summary",
        phase="phase-1",
        domain="procurement",
        classification=classification,
        tags=("quality-engineering", "procurement"),
        file_sha256="a" * 64,
        section_id="quality-engineering-summary",
        section_title="Quality Engineering Summary",
        locator="markdown:line:19",
        chunk_index=1,
        text=text,
        content_sha256="b" * 64,
    )


def create_result(
    *,
    chunk: KnowledgeChunk | None = None,
    score: float = 10.0,
) -> RetrievalResult:
    """Create a representative retrieval result."""

    return RetrievalResult(
        chunk=chunk or create_chunk(),
        score=score,
        matched_terms=(
            "phase",
            "requirements",
            "test",
        ),
    )


def test_prepare_evidence_creates_citation_and_context() -> None:
    prepared = prepare_evidence(
        (create_result(),),
        allowed_source_ids=(
            "NEXORA-QE-README-001",
        ),
    )

    assert prepared.has_evidence is True
    assert prepared.evidence_count == 1
    assert prepared.citations[0].source_id == (
        "NEXORA-QE-README-001"
    )
    assert "46 traceable requirements" in (
        prepared.context
    )
    assert "[EVIDENCE 1]" in prepared.context
    assert "[/EVIDENCE 1]" in prepared.context


def test_prepare_evidence_filters_unapproved_source() -> None:
    result = create_result(
        chunk=create_chunk(
            source_id="UNAPPROVED-SOURCE-001",
        )
    )

    prepared = prepare_evidence(
        (result,),
        allowed_source_ids=(
            "NEXORA-QE-README-001",
        ),
    )

    assert prepared.has_evidence is False
    assert prepared.evidence_count == 0
    assert prepared.context == ""
    assert prepared.citations == ()


def test_prepare_evidence_filters_wrong_classification() -> None:
    result = create_result(
        chunk=create_chunk(
            classification="CONFIDENTIAL",
        )
    )

    prepared = prepare_evidence(
        (result,),
        allowed_source_ids=(
            "NEXORA-QE-README-001",
        ),
    )

    assert prepared.has_evidence is False
    assert prepared.context == ""


def test_prepare_evidence_removes_duplicate_chunks() -> None:
    result = create_result()

    prepared = prepare_evidence(
        (
            result,
            result,
        ),
        allowed_source_ids=(
            "NEXORA-QE-README-001",
        ),
    )

    assert prepared.evidence_count == 1


def test_prepare_evidence_limits_number_of_results() -> None:
    first_result = create_result(
        chunk=create_chunk(
            chunk_id="README:chunk:0001",
        ),
        score=10.0,
    )
    second_result = create_result(
        chunk=create_chunk(
            chunk_id="README:chunk:0002",
            text="The catalogue contains 74 test cases.",
        ),
        score=9.0,
    )

    prepared = prepare_evidence(
        (
            first_result,
            second_result,
        ),
        allowed_source_ids=(
            "NEXORA-QE-README-001",
        ),
        max_results=1,
    )

    assert prepared.evidence_count == 1
    assert prepared.citations[0].chunk_id == (
        "README:chunk:0001"
    )


def test_prepare_evidence_truncates_long_excerpt() -> None:
    result = create_result(
        chunk=create_chunk(
            text="A" * 200,
        )
    )

    prepared = prepare_evidence(
        (result,),
        allowed_source_ids=(
            "NEXORA-QE-README-001",
        ),
        excerpt_characters=50,
    )

    excerpt = prepared.citations[0].excerpt

    assert len(excerpt) == 50
    assert excerpt.endswith("...")


def test_prepare_evidence_requires_allowed_sources() -> None:
    with pytest.raises(
        EvidencePreparationError,
        match="At least one allowed source ID is required",
    ):
        prepare_evidence(
            (create_result(),),
            allowed_source_ids=(),
        )


def test_prepare_evidence_rejects_invalid_result_limit() -> None:
    with pytest.raises(
        EvidencePreparationError,
        match="max_results must be between 1 and 10",
    ):
        prepare_evidence(
            (create_result(),),
            allowed_source_ids=(
                "NEXORA-QE-README-001",
            ),
            max_results=0,
        )