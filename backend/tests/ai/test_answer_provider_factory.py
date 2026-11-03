"""Tests for configured answer-provider creation."""

import pytest

import app.ai.answering.provider_factory as factory_module
from app.ai.answering.ollama_provider import (
    OllamaAnswerProvider,
)
from app.ai.answering.provider_factory import (
    AnswerProviderConfigurationError,
    create_answer_provider,
)


def test_create_answer_provider_returns_ollama(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(
        factory_module.settings,
        "ai_provider",
        "ollama",
    )

    provider = create_answer_provider()

    assert isinstance(
        provider,
        OllamaAnswerProvider,
    )


def test_create_answer_provider_normalises_name(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(
        factory_module.settings,
        "ai_provider",
        "  OLLAMA  ",
    )

    provider = create_answer_provider()

    assert isinstance(
        provider,
        OllamaAnswerProvider,
    )


def test_create_answer_provider_rejects_unknown_provider(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(
        factory_module.settings,
        "ai_provider",
        "unsupported-provider",
    )

    with pytest.raises(
        AnswerProviderConfigurationError,
        match="Unsupported AI provider",
    ):
        create_answer_provider()