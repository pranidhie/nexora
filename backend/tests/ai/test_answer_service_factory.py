"""Tests for grounded-answer service construction."""

from __future__ import annotations

from types import SimpleNamespace
from typing import Iterator

import pytest

import app.ai.answering.service_factory as factory_module
from app.ai.answering.service_factory import (
    get_grounded_answer_service,
)


@pytest.fixture(autouse=True)
def clear_service_cache() -> Iterator[None]:
    """Prevent cached services from leaking between tests."""

    get_grounded_answer_service.cache_clear()

    yield

    get_grounded_answer_service.cache_clear()


def test_factory_connects_all_answer_components(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """The factory should connect retrieval and generation."""

    retriever = object()
    provider = object()

    knowledge_base = SimpleNamespace(
        retriever=retriever,
        allowed_source_ids=(
            "SOURCE-001",
            "SOURCE-002",
        ),
    )

    captured_arguments: dict[str, object] = {}

    class FakeGroundedAnswerService:
        """Record service construction arguments."""

        def __init__(
            self,
            *,
            retriever: object,
            provider: object,
            allowed_source_ids: tuple[str, ...],
        ) -> None:
            captured_arguments["retriever"] = retriever
            captured_arguments["provider"] = provider
            captured_arguments[
                "allowed_source_ids"
            ] = allowed_source_ids

    monkeypatch.setattr(
        factory_module,
        "get_knowledge_base",
        lambda: knowledge_base,
    )

    monkeypatch.setattr(
        factory_module,
        "create_answer_provider",
        lambda: provider,
    )

    monkeypatch.setattr(
        factory_module,
        "GroundedAnswerService",
        FakeGroundedAnswerService,
    )

    service = get_grounded_answer_service()

    assert isinstance(
        service,
        FakeGroundedAnswerService,
    )

    assert captured_arguments["retriever"] is retriever
    assert captured_arguments["provider"] is provider

    assert captured_arguments[
        "allowed_source_ids"
    ] == (
        "SOURCE-001",
        "SOURCE-002",
    )


def test_factory_caches_the_service(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """The service should be constructed once per process."""

    knowledge_base_count = 0
    provider_count = 0

    knowledge_base = SimpleNamespace(
        retriever=object(),
        allowed_source_ids=("SOURCE-001",),
    )

    class FakeGroundedAnswerService:
        """Minimal replacement for the real service."""

        def __init__(
            self,
            **arguments: object,
        ) -> None:
            self.arguments = arguments

    def fake_get_knowledge_base() -> object:
        nonlocal knowledge_base_count

        knowledge_base_count += 1

        return knowledge_base

    def fake_create_answer_provider() -> object:
        nonlocal provider_count

        provider_count += 1

        return object()

    monkeypatch.setattr(
        factory_module,
        "get_knowledge_base",
        fake_get_knowledge_base,
    )

    monkeypatch.setattr(
        factory_module,
        "create_answer_provider",
        fake_create_answer_provider,
    )

    monkeypatch.setattr(
        factory_module,
        "GroundedAnswerService",
        FakeGroundedAnswerService,
    )

    first_service = get_grounded_answer_service()
    second_service = get_grounded_answer_service()

    assert first_service is second_service
    assert knowledge_base_count == 1
    assert provider_count == 1