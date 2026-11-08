"""Tests for the NEXORA Gemini answer provider."""

import asyncio

from typing import Any

import httpx
import pytest

import app.ai.answering.gemini_provider as provider_module

from app.ai.answering.gemini_provider import (
    GeminiAnswerProvider,
    GeminiProviderError,
)


class FakeResponse:
    """Controlled HTTP response used by provider tests."""

    def __init__(
        self,
        *,
        status_code: int = 200,
        payload: Any = None,
        invalid_json: bool = False,
    ) -> None:
        self.status_code = status_code
        self.payload = payload
        self.invalid_json = invalid_json

        self.request = httpx.Request(
            "POST",
            "https://gemini.test",
        )

    def raise_for_status(self) -> None:
        """Raise an HTTP error for unsuccessful responses."""

        if self.status_code >= 400:
            response = httpx.Response(
                self.status_code,
                request=self.request,
            )

            raise httpx.HTTPStatusError(
                "Controlled Gemini HTTP error.",
                request=self.request,
                response=response,
            )

    def json(self) -> Any:
        """Return controlled JSON or simulate invalid JSON."""

        if self.invalid_json:
            raise ValueError(
                "Controlled invalid JSON.",
            )

        return self.payload


class FakeAsyncClient:
    """Minimal asynchronous replacement for httpx.AsyncClient."""

    def __init__(
        self,
        *,
        response: FakeResponse | None = None,
        error: Exception | None = None,
        captured_request: dict[str, Any] | None = None,
    ) -> None:
        self.response = response
        self.error = error
        self.captured_request = captured_request

    async def __aenter__(self) -> "FakeAsyncClient":
        return self

    async def __aexit__(
        self,
        exception_type: object,
        exception: object,
        traceback: object,
    ) -> None:
        return None

    async def post(
        self,
        endpoint: str,
        *,
        json: dict[str, Any],
    ) -> FakeResponse:
        """Capture the request and return the configured result."""

        if self.captured_request is not None:
            self.captured_request["endpoint"] = endpoint
            self.captured_request["json"] = json

        if self.error is not None:
            raise self.error

        if self.response is None:
            raise RuntimeError(
                "Fake response was not configured.",
            )

        return self.response


def create_provider() -> GeminiAnswerProvider:
    """Create a provider with controlled test settings."""

    return GeminiAnswerProvider(
        base_url="https://gemini.test",
        model="controlled-gemini-model",
        api_key="controlled-api-key",
        timeout_seconds=5,
    )


def run_generation(
    provider: GeminiAnswerProvider,
    *,
    system_prompt: str = "Use only approved evidence.",
    user_prompt: str = "What is NEXORA?",
) -> str:
    """Execute the asynchronous provider from a synchronous test."""

    return asyncio.run(
        provider.generate(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
        )
    )


def install_fake_client(
    monkeypatch: pytest.MonkeyPatch,
    *,
    response: FakeResponse | None = None,
    error: Exception | None = None,
    captured_request: dict[str, Any] | None = None,
    captured_client_options: dict[str, Any] | None = None,
) -> None:
    """Replace the real HTTP client with a controlled fake."""

    def fake_client_factory(
        **kwargs: Any,
    ) -> FakeAsyncClient:
        if captured_client_options is not None:
            captured_client_options.update(
                kwargs,
            )

        return FakeAsyncClient(
            response=response,
            error=error,
            captured_request=captured_request,
        )

    monkeypatch.setattr(
        provider_module.httpx,
        "AsyncClient",
        fake_client_factory,
    )


def test_generate_returns_gemini_content(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    captured_request: dict[str, Any] = {}
    captured_client_options: dict[str, Any] = {}

    install_fake_client(
        monkeypatch,
        response=FakeResponse(
            payload={
                "candidates": [
                    {
                        "content": {
                            "parts": [
                                {
                                    "text": (
                                        "NEXORA is a quality "
                                        "engineering platform."
                                    ),
                                },
                            ],
                        },
                    },
                ],
            },
        ),
        captured_request=captured_request,
        captured_client_options=captured_client_options,
    )

    result = run_generation(
        create_provider(),
    )

    assert result == (
        "NEXORA is a quality engineering platform."
    )

    assert captured_request["endpoint"] == (
        "/v1beta/models/"
        "controlled-gemini-model:generateContent"
    )

    request_payload = captured_request["json"]

    assert request_payload["systemInstruction"] == {
        "parts": [
            {
                "text": "Use only approved evidence.",
            },
        ],
    }

    assert request_payload["contents"] == [
        {
            "role": "user",
            "parts": [
                {
                    "text": "What is NEXORA?",
                },
            ],
        },
    ]

    assert (
        captured_client_options["headers"][
            "x-goog-api-key"
        ]
        == "controlled-api-key"
    )


def test_generate_combines_multiple_text_parts(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    install_fake_client(
        monkeypatch,
        response=FakeResponse(
            payload={
                "candidates": [
                    {
                        "content": {
                            "parts": [
                                {
                                    "text": "First grounded part.",
                                },
                                {
                                    "text": "Second grounded part.",
                                },
                            ],
                        },
                    },
                ],
            },
        ),
    )

    result = run_generation(
        create_provider(),
    )

    assert result == (
        "First grounded part.\n"
        "Second grounded part."
    )


def test_generate_rejects_empty_system_prompt() -> None:
    with pytest.raises(
        ValueError,
        match="System prompt must not be empty",
    ):
        run_generation(
            create_provider(),
            system_prompt="   ",
        )


def test_generate_rejects_empty_user_prompt() -> None:
    with pytest.raises(
        ValueError,
        match="User prompt must not be empty",
    ):
        run_generation(
            create_provider(),
            user_prompt="   ",
        )


def test_generate_handles_timeout(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    install_fake_client(
        monkeypatch,
        error=httpx.ReadTimeout(
            "Controlled timeout.",
        ),
    )

    with pytest.raises(
        GeminiProviderError,
        match="did not respond within",
    ):
        run_generation(
            create_provider(),
        )


def test_generate_handles_http_error(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    install_fake_client(
        monkeypatch,
        response=FakeResponse(
            status_code=429,
            payload={},
        ),
    )

    with pytest.raises(
        GeminiProviderError,
        match="Gemini returned HTTP 429",
    ):
        run_generation(
            create_provider(),
        )


def test_generate_handles_connection_error(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    request = httpx.Request(
        "POST",
        "https://gemini.test",
    )

    install_fake_client(
        monkeypatch,
        error=httpx.ConnectError(
            "Controlled connection error.",
            request=request,
        ),
    )

    with pytest.raises(
        GeminiProviderError,
        match="could not connect to Gemini",
    ):
        run_generation(
            create_provider(),
        )


def test_generate_rejects_invalid_json(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    install_fake_client(
        monkeypatch,
        response=FakeResponse(
            payload={},
            invalid_json=True,
        ),
    )

    with pytest.raises(
        GeminiProviderError,
        match="returned invalid JSON",
    ):
        run_generation(
            create_provider(),
        )


def test_generate_rejects_missing_candidates(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    install_fake_client(
        monkeypatch,
        response=FakeResponse(
            payload={
                "candidates": [],
            },
        ),
    )

    with pytest.raises(
        GeminiProviderError,
        match="does not contain an answer candidate",
    ):
        run_generation(
            create_provider(),
        )


def test_generate_rejects_empty_answer(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    install_fake_client(
        monkeypatch,
        response=FakeResponse(
            payload={
                "candidates": [
                    {
                        "content": {
                            "parts": [
                                {
                                    "text": "   ",
                                },
                            ],
                        },
                    },
                ],
            },
        ),
    )

    with pytest.raises(
        GeminiProviderError,
        match="returned an empty answer",
    ):
        run_generation(
            create_provider(),
        )


def test_provider_requires_api_key() -> None:
    with pytest.raises(
        ValueError,
        match="Gemini API key must not be empty",
    ):
        GeminiAnswerProvider(
            base_url="https://gemini.test",
            model="controlled-gemini-model",
            api_key="",
            timeout_seconds=5,
        )


def test_provider_rejects_invalid_timeout() -> None:
    with pytest.raises(
        ValueError,
        match="Gemini timeout must be greater than zero",
    ):
        GeminiAnswerProvider(
            base_url="https://gemini.test",
            model="controlled-gemini-model",
            api_key="controlled-api-key",
            timeout_seconds=0,
        )