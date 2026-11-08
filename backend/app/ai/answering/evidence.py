"""Prepare approved retrieval evidence for grounded answering."""

from __future__ import annotations

from dataclasses import dataclass

from app.ai.answering.models import AnswerCitation
from app.ai.retrieval.lexical import (
    APPROVED_CLASSIFICATION,
    RetrievalResult,
)


DEFAULT_MAX_RESULTS = 5
MAX_ALLOWED_RESULTS = 10
DEFAULT_EXCERPT_CHARACTERS = 500
MAX_EXCERPT_CHARACTERS = 2_000


class EvidencePreparationError(ValueError):
    """Raised when retrieved evidence cannot be prepared safely."""


@dataclass(frozen=True)
class PreparedEvidence:
    """Approved evidence prepared for grounded answer generation."""

    context: str
    citations: tuple[AnswerCitation, ...]

    @property
    def evidence_count(self) -> int:
        """Return the number of approved evidence chunks."""

        return len(self.citations)

    @property
    def has_evidence(self) -> bool:
        """Return whether approved evidence is available."""

        return bool(self.citations)


def _normalise_text(value: str) -> str:
    """Collapse repeated whitespace while preserving content."""

    return " ".join(value.split())


def _truncate_text(
    value: str,
    *,
    maximum_characters: int,
) -> str:
    """Return deterministic text within the configured limit."""

    normalised_value = _normalise_text(value)

    if len(normalised_value) <= maximum_characters:
        return normalised_value

    truncated_value = normalised_value[
        : maximum_characters - 3
    ].rstrip()

    return f"{truncated_value}..."


def _build_context_block(
    *,
    evidence_number: int,
    citation: AnswerCitation,
) -> str:
    """Format one clearly bounded evidence block."""

    return "\n".join(
        (
            f"[EVIDENCE {evidence_number}]",
            f"Source ID: {citation.source_id}",
            f"Chunk ID: {citation.chunk_id}",
            f"Section: {citation.section}",
            f"Locator: {citation.locator}",
            f"Content: {citation.excerpt}",
            f"[/EVIDENCE {evidence_number}]",
        )
    )


def prepare_evidence(
    retrieval_results: tuple[RetrievalResult, ...],
    *,
    allowed_source_ids: tuple[str, ...],
    max_results: int = DEFAULT_MAX_RESULTS,
    excerpt_characters: int = DEFAULT_EXCERPT_CHARACTERS,
) -> PreparedEvidence:
    """Filter, deduplicate, cite, and format retrieved evidence."""

    if not allowed_source_ids:
        raise EvidencePreparationError(
            "At least one allowed source ID is required."
        )

    if (
        max_results < 1
        or max_results > MAX_ALLOWED_RESULTS
    ):
        raise EvidencePreparationError(
            f"max_results must be between 1 and "
            f"{MAX_ALLOWED_RESULTS}."
        )

    if (
        excerpt_characters < 50
        or excerpt_characters > MAX_EXCERPT_CHARACTERS
    ):
        raise EvidencePreparationError(
            f"excerpt_characters must be between 50 and "
            f"{MAX_EXCERPT_CHARACTERS}."
        )

    allowed_sources = set(allowed_source_ids)
    seen_chunk_ids: set[str] = set()
    citations: list[AnswerCitation] = []

    for result in retrieval_results:
        chunk = result.chunk

        if chunk.source_id not in allowed_sources:
            continue

        if (
            chunk.classification
            != APPROVED_CLASSIFICATION
        ):
            continue

        if chunk.chunk_id in seen_chunk_ids:
            continue

        excerpt = _truncate_text(
            chunk.text,
            maximum_characters=excerpt_characters,
        )

        if not excerpt:
            continue

        citation = AnswerCitation(
            source_id=chunk.source_id,
            chunk_id=chunk.chunk_id,
            section=chunk.section_title,
            locator=chunk.locator,
            excerpt=excerpt,
        )

        citations.append(citation)
        seen_chunk_ids.add(chunk.chunk_id)

        if len(citations) == max_results:
            break

    context_blocks = tuple(
        _build_context_block(
            evidence_number=index,
            citation=citation,
        )
        for index, citation in enumerate(
            citations,
            start=1,
        )
    )

    return PreparedEvidence(
        context="\n\n".join(context_blocks),
        citations=tuple(citations),
    )