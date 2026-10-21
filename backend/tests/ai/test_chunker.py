"""Tests for deterministic and traceable knowledge chunking."""

from app.ai.ingestion.chunker import (
    ChunkingConfig,
    ChunkingError,
    chunk_document,
    chunk_documents,
)
from app.ai.ingestion.extractors import (
    extract_manifest_documents,
)
from app.ai.ingestion.manifest import (
    load_knowledge_manifest,
)
from app.ai.ingestion.models import (
    ExtractedDocument,
    ExtractedSection,
)

import pytest


def build_document(
    text: str,
) -> ExtractedDocument:
    """Build a small extracted document for unit testing."""

    section = ExtractedSection(
        section_id="SOURCE-001:section:1",
        source_id="SOURCE-001",
        title="Security Requirements",
        locator="markdown:line:10",
        text=text,
    )

    return ExtractedDocument(
        source_id="SOURCE-001",
        title="Test Document",
        relative_path="docs/test.md",
        format="markdown",
        document_type="test_document",
        phase="phase-1",
        domain="procurement",
        classification="PUBLIC_SANITISED",
        tags=("security", "testing"),
        file_sha256="document-hash",
        sections=(section,),
    )


def test_short_section_creates_one_traceable_chunk() -> None:
    document = build_document(
        "Unauthenticated access must be rejected."
    )

    chunks = chunk_document(document)

    assert len(chunks) == 1

    chunk = chunks[0]

    assert (
        chunk.chunk_id
        == "SOURCE-001:section:1:chunk:0001"
    )
    assert chunk.source_id == "SOURCE-001"
    assert chunk.section_title == "Security Requirements"
    assert chunk.locator == "markdown:line:10"
    assert chunk.classification == "PUBLIC_SANITISED"
    assert chunk.content_sha256
    assert chunk.character_count == len(chunk.text)


def test_long_section_is_split_with_size_limits() -> None:
    text = " ".join(
        f"requirement-{index}"
        for index in range(100)
    )

    document = build_document(text)

    config = ChunkingConfig(
        max_chars=120,
        overlap_chars=20,
    )

    chunks = chunk_document(
        document,
        config,
    )

    assert len(chunks) > 1

    assert all(
        chunk.character_count <= 120
        for chunk in chunks
    )

    assert len(
        {
            chunk.chunk_id
            for chunk in chunks
        }
    ) == len(chunks)

    assert all(
        len(chunk.content_sha256) == 64
        for chunk in chunks
    )


def test_invalid_chunk_configuration_is_rejected() -> None:
    with pytest.raises(
        ChunkingError,
        match="smaller than max_chars",
    ):
        ChunkingConfig(
            max_chars=100,
            overlap_chars=100,
        )

    with pytest.raises(
        ChunkingError,
        match="cannot be negative",
    ):
        ChunkingConfig(
            max_chars=100,
            overlap_chars=-1,
        )


def test_approved_sources_create_traceable_chunks() -> None:
    manifest = load_knowledge_manifest()

    documents = extract_manifest_documents(
        manifest
    )

    chunks = chunk_documents(documents)

    assert chunks

    approved_source_ids = {
        source.source_id
        for source in manifest.sources
    }

    chunk_source_ids = {
        chunk.source_id
        for chunk in chunks
    }

    assert chunk_source_ids == approved_source_ids

    assert all(
        chunk.character_count <= 1_200
        for chunk in chunks
    )

    assert all(
        chunk.file_sha256
        for chunk in chunks
    )

    assert all(
        chunk.locator
        for chunk in chunks
    )

    assert all(
        chunk.classification
        == "PUBLIC_SANITISED"
        for chunk in chunks
    )