"""Tests for the approved NEXORA knowledge-base factory."""

from __future__ import annotations

from types import SimpleNamespace
from typing import Iterator

import pytest

import app.ai.knowledge_base as knowledge_base_module
from app.ai.knowledge_base import (
    KnowledgeBaseError,
    build_knowledge_base,
    get_knowledge_base,
)


@pytest.fixture(autouse=True)
def clear_knowledge_base_cache() -> Iterator[None]:
    """Prevent cached state from leaking between tests."""

    get_knowledge_base.cache_clear()

    yield

    get_knowledge_base.cache_clear()


def test_build_knowledge_base_uses_approved_documents(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Approved documents should produce one retriever."""

    manifest = object()

    documents = (
        SimpleNamespace(source_id="SOURCE-001"),
        SimpleNamespace(source_id="SOURCE-002"),
        SimpleNamespace(source_id="SOURCE-001"),
    )

    chunks = (
        object(),
        object(),
        object(),
    )

    captured_chunks: list[tuple[object, ...]] = []

    class FakeRetriever:
        """Record the chunks supplied to the retriever."""

        def __init__(
            self,
            received_chunks: tuple[object, ...],
        ) -> None:
            captured_chunks.append(received_chunks)

    monkeypatch.setattr(
        knowledge_base_module,
        "load_knowledge_manifest",
        lambda: manifest,
    )

    monkeypatch.setattr(
        knowledge_base_module,
        "extract_manifest_documents",
        lambda received_manifest: documents,
    )

    monkeypatch.setattr(
        knowledge_base_module,
        "chunk_documents",
        lambda received_documents: chunks,
    )

    monkeypatch.setattr(
        knowledge_base_module,
        "LexicalRetriever",
        FakeRetriever,
    )

    knowledge_base = build_knowledge_base()

    assert knowledge_base.document_count == 3
    assert knowledge_base.chunk_count == 3

    assert knowledge_base.allowed_source_ids == (
        "SOURCE-001",
        "SOURCE-002",
    )

    assert captured_chunks == [chunks]

    assert isinstance(
        knowledge_base.retriever,
        FakeRetriever,
    )


def test_build_knowledge_base_rejects_empty_documents(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """An empty approved manifest must fail safely."""

    monkeypatch.setattr(
        knowledge_base_module,
        "load_knowledge_manifest",
        lambda: object(),
    )

    monkeypatch.setattr(
        knowledge_base_module,
        "extract_manifest_documents",
        lambda manifest: (),
    )

    with pytest.raises(
        KnowledgeBaseError,
        match="no documents",
    ):
        build_knowledge_base()


def test_build_knowledge_base_rejects_empty_chunks(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Documents that produce no chunks must fail safely."""

    documents = (
        SimpleNamespace(source_id="SOURCE-001"),
    )

    monkeypatch.setattr(
        knowledge_base_module,
        "load_knowledge_manifest",
        lambda: object(),
    )

    monkeypatch.setattr(
        knowledge_base_module,
        "extract_manifest_documents",
        lambda manifest: documents,
    )

    monkeypatch.setattr(
        knowledge_base_module,
        "chunk_documents",
        lambda received_documents: (),
    )

    with pytest.raises(
        KnowledgeBaseError,
        match="no knowledge chunks",
    ):
        build_knowledge_base()


def test_get_knowledge_base_caches_the_result(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """The application should build its knowledge base once."""

    created_knowledge_base = object()
    build_count = 0

    def fake_build_knowledge_base() -> object:
        nonlocal build_count

        build_count += 1

        return created_knowledge_base

    monkeypatch.setattr(
        knowledge_base_module,
        "build_knowledge_base",
        fake_build_knowledge_base,
    )

    first_result = get_knowledge_base()
    second_result = get_knowledge_base()

    assert first_result is created_knowledge_base
    assert second_result is created_knowledge_base
    assert build_count == 1