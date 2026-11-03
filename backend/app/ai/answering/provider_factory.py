"""Create the configured NEXORA answer provider."""

from __future__ import annotations

from app.ai.answering.ollama_provider import (
    OllamaAnswerProvider,
)
from app.ai.answering.provider import AnswerProvider
from app.core.config import settings


class AnswerProviderConfigurationError(RuntimeError):
    """Raised when the configured AI provider is unsupported."""


def create_answer_provider() -> AnswerProvider:
    """Create the answer provider selected by configuration."""

    provider_name = (
        settings.ai_provider
        .strip()
        .lower()
    )

    if provider_name == "ollama":
        return OllamaAnswerProvider(
            base_url=settings.ollama_base_url,
            model=settings.ollama_model,
            timeout_seconds=(
                settings.ollama_timeout_seconds
            ),
        )

    raise AnswerProviderConfigurationError(
        f"Unsupported AI provider: "
        f"{settings.ai_provider!r}."
    )