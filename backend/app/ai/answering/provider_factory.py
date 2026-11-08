"""Create the configured NEXORA answer provider."""

from __future__ import annotations

from app.ai.answering.gemini_provider import (
    GeminiAnswerProvider,
)
from app.ai.answering.ollama_provider import (
    OllamaAnswerProvider,
)
from app.ai.answering.provider import (
    AnswerProvider,
)
from app.core.config import settings


class AnswerProviderConfigurationError(
    RuntimeError,
):
    """Raised when AI provider configuration is invalid."""


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
            api_key=settings.ollama_api_key,
        )

    if provider_name == "gemini":
        if not (
            settings.gemini_api_key
            and settings.gemini_api_key.strip()
        ):
            raise AnswerProviderConfigurationError(
                "GEMINI_API_KEY must be configured "
                "when AI_PROVIDER is set to gemini."
            )

        return GeminiAnswerProvider(
            base_url=settings.gemini_base_url,
            model=settings.gemini_model,
            api_key=settings.gemini_api_key,
            timeout_seconds=(
                settings.gemini_timeout_seconds
            ),
        )

    raise AnswerProviderConfigurationError(
        f"Unsupported AI provider: "
        f"{settings.ai_provider!r}."
    )