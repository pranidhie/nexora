"""Regression tests for real NEXORA retrieval ranking."""

from app.ai.ingestion.chunker import (
    chunk_documents,
)
from app.ai.ingestion.extractors import (
    extract_manifest_documents,
)
from app.ai.ingestion.manifest import (
    load_knowledge_manifest,
)
from app.ai.retrieval.lexical import (
    LexicalRetriever,
)


TRACEABLE_REQUIREMENTS_CHUNK_ID = (
    "NEXORA-QE-README-001:"
    "section:4:chunk:0001"
)


def test_traceable_requirements_chunk_ranks_first() -> None:
    """The exact requirements-count evidence should rank first."""

    manifest = load_knowledge_manifest()

    documents = extract_manifest_documents(
        manifest
    )

    chunks = chunk_documents(
        documents
    )

    retriever = LexicalRetriever(
        chunks
    )

    results = retriever.search(
        (
            "How many traceable requirements are "
            "included in the NEXORA Phase 1 "
            "test design baseline?"
        ),
        top_k=5,
    )

    assert results

    first_result = results[0]

    assert first_result.chunk.chunk_id == (
        TRACEABLE_REQUIREMENTS_CHUNK_ID
    )

    assert (
        "46 traceable requirements"
        in first_result.chunk.text.lower()
    )