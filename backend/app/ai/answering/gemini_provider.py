"""Gemini implementation of the NEXORA answer-provider contract."""

from __future__ import annotations

from typing import Any

import httpx

from app.core.config import settings


class GeminiProviderError(RuntimeError):
    """Raised when Gemini cannot produce a valid response."""


class GeminiAnswerProvider:
    """Generate controlled answers using the Gemini API."""

    def __init__(
        self,
        *,
        base_url: str | None = None,
        model: str | None = None,
        api_key: str | None = None,
        timeout_seconds: float | None = None,
    ) -> None:
        self._base_url = (
            base_url
            or settings.gemini_base_url
        ).strip().rstrip("/")

        self._model = (
            model
            or settings.gemini_model
        ).strip()

        configured_api_key = (
            api_key
            if api_key is not None
            else settings.gemini_api_key
        )

        self._api_key = (
            configured_api_key.strip()
            if configured_api_key
            else ""
        )

        self._timeout_seconds = (
            timeout_seconds
            if timeout_seconds is not None
            else settings.gemini_timeout_seconds
        )

        if not self._base_url:
            raise ValueError(
                "Gemini base URL must not be empty."
            )

        if not self._model:
            raise ValueError(
                "Gemini model must not be empty."
            )

        if not self._api_key:
            raise ValueError(
                "Gemini API key must not be empty."
            )

        if self._timeout_seconds <= 0:
            raise ValueError(
                "Gemini timeout must be greater than zero."
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
            "systemInstruction": {
                "parts": [
                    {
                        "text": system_prompt.strip(),
                    },
                ],
            },
            "contents": [
                {
                    "role": "user",
                    "parts": [
                        {
                            "text": user_prompt.strip(),
                        },
                    ],
                },
            ],
            "generationConfig": {
                "temperature": 0.0,
                "maxOutputTokens": 512,
            },
        }

        endpoint = (
            f"/v1beta/models/{self._model}:generateContent"
        )

        try:
            async with httpx.AsyncClient(
                base_url=self._base_url,
                timeout=httpx.Timeout(
                    self._timeout_seconds,
                ),
                headers={
                    "x-goog-api-key": self._api_key,
                    "Content-Type": "application/json",
                },
            ) as client:
                response = await client.post(
                    endpoint,
                    json=request_payload,
                )

                response.raise_for_status()

        except httpx.TimeoutException as error:
            raise GeminiProviderError(
                "Gemini did not respond within "
                f"{self._timeout_seconds} seconds."
            ) from error

        except httpx.HTTPStatusError as error:
            raise GeminiProviderError(
                "Gemini returned HTTP "
                f"{error.response.status_code}."
            ) from error

        except httpx.RequestError as error:
            raise GeminiProviderError(
                "NEXORA could not connect to Gemini."
            ) from error

        try:
            response_body = response.json()
        except ValueError as error:
            raise GeminiProviderError(
                "Gemini returned invalid JSON."
            ) from error

        candidates = response_body.get("candidates")

        if (
            not isinstance(candidates, list)
            or not candidates
        ):
            raise GeminiProviderError(
                "Gemini response does not contain "
                "an answer candidate."
            )

        first_candidate = candidates[0]

        if not isinstance(first_candidate, dict):
            raise GeminiProviderError(
                "Gemini returned an invalid candidate."
            )

        content = first_candidate.get("content")

        if not isinstance(content, dict):
            raise GeminiProviderError(
                "Gemini candidate does not contain content."
            )

        parts = content.get("parts")

        if (
            not isinstance(parts, list)
            or not parts
        ):
            raise GeminiProviderError(
                "Gemini content does not contain answer parts."
            )

        generated_parts: list[str] = []

        for part in parts:
            if not isinstance(part, dict):
                continue

            text = part.get("text")

            if (
                isinstance(text, str)
                and text.strip()
            ):
                generated_parts.append(
                    text.strip(),
                )

        generated_content = "\n".join(
            generated_parts,
        ).strip()

        if not generated_content:
            raise GeminiProviderError(
                "Gemini returned an empty answer."
            )

        return generated_content