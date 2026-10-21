"""Deterministic lexical retrieval for the NEXORA knowledge base."""

from __future__ import annotations

import math
import re
from collections import Counter
from dataclasses import dataclass

from app.ai.ingestion.models import KnowledgeChunk


APPROVED_CLASSIFICATION = "PUBLIC_SANITISED"
MAX_QUERY_CHARACTERS = 1_000
MAX_TOP_K = 20

TOKEN_PATTERN = re.compile(r"[a-z0-9]+")

STOP_WORDS = {
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "by",
    "can",
    "does",
    "for",
    "from",
    "have",
    "how",
    "in",
    "is",
    "it",
    "of",
    "on",
    "or",
    "that",
    "the",
    "this",
    "to",
    "was",
    "were",
    "what",
    "when",
    "which",
    "with",
}


class RetrievalError(ValueError):
    """Raised when retrieval input or indexed content is invalid."""


@dataclass(frozen=True)
class RetrievalResult:
    """One ranked retrieval result with provenance."""

    chunk: KnowledgeChunk
    score: float
    matched_terms: tuple[str, ...]


def _normalise_for_phrase(
    value: str,
) -> str:
    """Normalise text for deterministic phrase matching."""

    return " ".join(
        TOKEN_PATTERN.findall(value.lower())
    )


def _tokenise(
    value: str,
) -> tuple[str, ...]:
    """Convert text into searchable lowercase terms."""

    return tuple(
        token
        for token in TOKEN_PATTERN.findall(
            value.lower()
        )
        if token not in STOP_WORDS
    )


class LexicalRetriever:
    """Rank approved chunks using deterministic lexical relevance."""

    def __init__(
        self,
        chunks: tuple[KnowledgeChunk, ...],
    ) -> None:
        if not chunks:
            raise RetrievalError(
                "At least one knowledge chunk is required."
            )

        seen_chunk_ids: set[str] = set()

        for chunk in chunks:
            if (
                chunk.classification
                != APPROVED_CLASSIFICATION
            ):
                raise RetrievalError(
                    f"Chunk {chunk.chunk_id} has an "
                    f"unapproved classification."
                )

            if not chunk.text.strip():
                raise RetrievalError(
                    f"Chunk {chunk.chunk_id} has no text."
                )

            if chunk.chunk_id in seen_chunk_ids:
                raise RetrievalError(
                    f"Duplicate chunk_id: {chunk.chunk_id}"
                )

            seen_chunk_ids.add(chunk.chunk_id)

        self._chunks = chunks

        self._term_frequencies = tuple(
            Counter(_tokenise(chunk.text))
            for chunk in chunks
        )

        self._metadata_terms = tuple(
            set(
                _tokenise(
                    " ".join(
                        (
                            chunk.document_title,
                            chunk.section_title,
                            chunk.document_type,
                            chunk.domain,
                            *chunk.tags,
                        )
                    )
                )
            )
            for chunk in chunks
        )

        self._document_frequencies = (
            self._calculate_document_frequencies()
        )

    def _calculate_document_frequencies(
        self,
    ) -> Counter[str]:
        """Count how many chunks contain each searchable term."""

        document_frequencies: Counter[str] = Counter()

        for term_frequency in self._term_frequencies:
            document_frequencies.update(
                term_frequency.keys()
            )

        return document_frequencies

    def _inverse_document_frequency(
        self,
        term: str,
    ) -> float:
        """Calculate smoothed inverse document frequency."""

        total_chunks = len(self._chunks)

        document_frequency = (
            self._document_frequencies.get(
                term,
                0,
            )
        )

        return (
            math.log(
                (total_chunks + 1)
                / (document_frequency + 1)
            )
            + 1
        )

    def _score_chunk(
        self,
        *,
        query_terms: set[str],
        normalised_query: str,
        chunk: KnowledgeChunk,
        term_frequency: Counter[str],
        metadata_terms: set[str],
    ) -> RetrievalResult | None:
        """Calculate a deterministic relevance score."""

        chunk_terms = set(
            term_frequency.keys()
        )

        matched_terms = (
            query_terms
            & chunk_terms
        )

        metadata_matches = (
            query_terms
            & metadata_terms
        )

        all_matches = (
            matched_terms
            | metadata_matches
        )

        if not all_matches:
            return None

        lexical_score = sum(
            self._inverse_document_frequency(term)
            * (
                1
                + math.log(
                    term_frequency[term]
                )
            )
            for term in matched_terms
        )

        coverage_score = (
            len(all_matches)
            / len(query_terms)
        ) * 2.0

        metadata_score = (
            len(metadata_matches)
            * 0.5
        )

        phrase_score = 0.0

        if (
            len(query_terms) >= 2
            and normalised_query
            in _normalise_for_phrase(
                chunk.text
            )
        ):
            phrase_score = 2.5

        total_score = (
            lexical_score
            + coverage_score
            + metadata_score
            + phrase_score
        )

        return RetrievalResult(
            chunk=chunk,
            score=round(
                total_score,
                6,
            ),
            matched_terms=tuple(
                sorted(all_matches)
            ),
        )

    def search(
        self,
        query: str,
        *,
        top_k: int = 5,
        minimum_score: float = 0.0,
    ) -> tuple[RetrievalResult, ...]:
        """Return the highest-ranking approved knowledge chunks."""

        if not isinstance(query, str) or not query.strip():
            raise RetrievalError(
                "Search query must be a non-empty string."
            )

        if len(query) > MAX_QUERY_CHARACTERS:
            raise RetrievalError(
                f"Search query exceeds the "
                f"{MAX_QUERY_CHARACTERS}-character limit."
            )

        if top_k < 1 or top_k > MAX_TOP_K:
            raise RetrievalError(
                f"top_k must be between 1 and "
                f"{MAX_TOP_K}."
            )

        if minimum_score < 0:
            raise RetrievalError(
                "minimum_score cannot be negative."
            )

        query_terms = set(
            _tokenise(query)
        )

        if not query_terms:
            return ()

        normalised_query = (
            _normalise_for_phrase(query)
        )

        results: list[RetrievalResult] = []

        for (
            chunk,
            term_frequency,
            metadata_terms,
        ) in zip(
            self._chunks,
            self._term_frequencies,
            self._metadata_terms,
            strict=True,
        ):
            result = self._score_chunk(
                query_terms=query_terms,
                normalised_query=normalised_query,
                chunk=chunk,
                term_frequency=term_frequency,
                metadata_terms=metadata_terms,
            )

            if (
                result is not None
                and result.score >= minimum_score
            ):
                results.append(result)

        results.sort(
            key=lambda result: (
                -result.score,
                result.chunk.source_id,
                result.chunk.chunk_id,
            )
        )

        return tuple(
            results[:top_k]
        )