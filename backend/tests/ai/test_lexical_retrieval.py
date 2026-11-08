"""Tests for deterministic baseline lexical retrieval."""

import pytest

from app.ai.ingestion.models import KnowledgeChunk
from app.ai.retrieval.lexical import (
    LexicalRetriever,
    RetrievalError,
)


def build_chunk(
    *,
    chunk_id: str,
    text: str,
    tags: tuple[str, ...] = (),
    classification: str = "PUBLIC_SANITISED",
) -> KnowledgeChunk:
    """Build a small traceable chunk for retrieval testing."""

    return KnowledgeChunk(
        chunk_id=chunk_id,
        source_id="SOURCE-001",
        document_title="NEXORA Test Baseline",
        relative_path="docs/test.md",
        format="markdown",
        document_type="quality_engineering_overview",
        phase="phase-1",
        domain="procurement",
        classification=classification,
        tags=tags,
        file_sha256="document-hash",
        section_id="SOURCE-001:section:1",
        section_title="Quality Engineering",
        locator="markdown:line:1",
        chunk_index=1,
        text=text,
        content_sha256="content-hash",
    )


def test_most_relevant_inventory_chunk_ranks_first() -> None:
    chunks = (
        build_chunk(
            chunk_id="chunk-001",
            text=(
                "Supplier management supports "
                "supplier creation and retrieval."
            ),
            tags=("supplier",),
        ),
        build_chunk(
            chunk_id="chunk-002",
            text=(
                "Goods receipt processing updates the "
                "inventory balance and creates an "
                "inventory transaction."
            ),
            tags=("inventory", "goods-receipt"),
        ),
        build_chunk(
            chunk_id="chunk-003",
            text=(
                "Purchase requests use approval "
                "workflow validation."
            ),
            tags=("approval",),
        ),
    )

    retriever = LexicalRetriever(chunks)

    results = retriever.search(
        "How does a goods receipt update inventory?"
    )

    assert results
    assert results[0].chunk.chunk_id == "chunk-002"
    assert "inventory" in results[0].matched_terms


def test_numeric_facts_are_searchable() -> None:
    chunks = (
        build_chunk(
            chunk_id="chunk-046",
            text=(
                "The baseline contains 46 "
                "traceable requirements."
            ),
        ),
        build_chunk(
            chunk_id="chunk-074",
            text=(
                "The catalogue contains 74 "
                "planned test cases."
            ),
        ),
    )

    retriever = LexicalRetriever(chunks)

    results = retriever.search(
        "How many traceable requirements are there?"
    )

    assert results[0].chunk.chunk_id == "chunk-046"
    assert "requirements" in results[0].matched_terms


def test_unknown_query_returns_no_results() -> None:
    retriever = LexicalRetriever(
        (
            build_chunk(
                chunk_id="chunk-001",
                text=(
                    "Purchase order approval "
                    "and inventory testing."
                ),
            ),
        )
    )

    results = retriever.search(
        "astronomy telescope galaxy"
    )

    assert results == ()


def test_top_k_limits_number_of_results() -> None:
    chunks = tuple(
        build_chunk(
            chunk_id=f"chunk-{index:03d}",
            text=(
                f"Inventory verification record "
                f"number {index}."
            ),
        )
        for index in range(1, 6)
    )

    retriever = LexicalRetriever(chunks)

    results = retriever.search(
        "inventory verification",
        top_k=2,
    )

    assert len(results) == 2


def test_unapproved_chunk_is_rejected() -> None:
    restricted_chunk = build_chunk(
        chunk_id="restricted-001",
        text="Restricted credential information.",
        classification="RESTRICTED",
    )

    with pytest.raises(
        RetrievalError,
        match="unapproved classification",
    ):
        LexicalRetriever(
            (restricted_chunk,)
        )