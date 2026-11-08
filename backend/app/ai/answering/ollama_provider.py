"""Ollama implementation of the NEXORA answer-provider contract."""

from __future__ import annotations

from typing import Any

import httpx

from app.core.config import settings


class OllamaProviderError(RuntimeError):
    """Raised when Ollama cannot produce a valid response."""


class OllamaAnswerProvider:
    """Generate controlled answers using local or hosted Ollama."""

    def __init__(
        self,
        *,
        base_url: str | None = None,
        model: str | None = None,
        timeout_seconds: float | None = None,
        api_key: str | None = None,
    ) -> None:
        self._base_url = (
            base_url
            or settings.ollama_base_url
        ).strip().rstrip("/")

        self._model = (
            model
            or settings.ollama_model
        ).strip()

        self._timeout_seconds = (
            timeout_seconds
            if timeout_seconds is not None
            else settings.ollama_timeout_seconds
        )

        configured_api_key = (
            api_key
            if api_key is not None
            else settings.ollama_api_key
        )

        self._api_key = (
            configured_api_key.strip()
            if configured_api_key
            else None
        )

        if not self._base_url:
            raise ValueError(
                "Ollama base URL must not be empty."
            )

        if not self._model:
            raise ValueError(
                "Ollama model must not be empty."
            )

        if self._timeout_seconds <= 0:
            raise ValueError(
                "Ollama timeout must be greater than zero."
            )

    async def generate(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
    ) -> str:
        """Generate one raw answer from controlled prompts."""

        if not system_prompt.strip():
            raise ValueError(
                "System prompt must not be empty."
            )

        if not user_prompt.strip():
            raise ValueError(
                "User prompt must not be empty."
            )

        request_payload: dict[str, Any] = {
            "model": self._model,
            "stream": False,
            "think": False,
            "messages": [
                {
                    "role": "system",
                    "content": system_prompt.strip(),
                },
                {
                    "role": "user",
                    "content": user_prompt.strip(),
                },
            ],
            "options": {
                "temperature": 0.0,
            },
        }

        client_options: dict[str, Any] = {
            "base_url": self._base_url,
            "timeout": httpx.Timeout(
                self._timeout_seconds
            ),
        }

        if self._api_key:
            client_options["headers"] = {
                "Authorization": (
                    f"Bearer {self._api_key}"
                ),
            }

        try:
            async with httpx.AsyncClient(
                **client_options
            ) as client:
                response = await client.post(
                    "/api/chat",
                    json=request_payload,
                )

                response.raise_for_status()

        except httpx.TimeoutException as error:
            raise OllamaProviderError(
                "Ollama did not respond within "
                f"{self._timeout_seconds} seconds."
            ) from error

        except httpx.HTTPStatusError as error:
            raise OllamaProviderError(
                "Ollama returned HTTP "
                f"{error.response.status_code}."
            ) from error

        except httpx.RequestError as error:
            raise OllamaProviderError(
                "NEXORA could not connect to Ollama at "
                f"{self._base_url}."
            ) from error

        try:
            response_body = response.json()
        except ValueError as error:
            raise OllamaProviderError(
                "Ollama returned invalid JSON."
            ) from error

        message = response_body.get("message")

        if not isinstance(message, dict):
            raise OllamaProviderError(
                "Ollama response does not contain a message."
            )

        generated_content = message.get("content")

        if (
            not isinstance(generated_content, str)
            or not generated_content.strip()
        ):
            raise OllamaProviderError(
                "Ollama returned an empty answer."
            )

        return generated_content.strip()