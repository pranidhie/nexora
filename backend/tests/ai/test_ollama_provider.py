"""Tests for the local Ollama answer provider."""

from __future__ import annotations

import asyncio
from typing import Any

import httpx
import pytest

import app.ai.answering.ollama_provider as provider_module
from app.ai.answering.ollama_provider import (
    OllamaAnswerProvider,
    OllamaProviderError,
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
            "http://ollama.test/api/chat",
        )

    def raise_for_status(self) -> None:
        if self.status_code >= 400:
            response = httpx.Response(
                self.status_code,
                request=self.request,
            )

            raise httpx.HTTPStatusError(
                "Controlled Ollama HTTP failure.",
                request=self.request,
                response=response,
            )

    def json(self) -> Any:
        if self.invalid_json:
            raise ValueError(
                "Controlled invalid JSON."
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

    async def __aenter__(self) -> FakeAsyncClient:
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
        if self.captured_request is not None:
            self.captured_request["endpoint"] = endpoint
            self.captured_request["payload"] = json

        if self.error is not None:
            raise self.error

        if self.response is None:
            raise AssertionError(
                "A fake response must be configured."
            )

        return self.response


def create_provider() -> OllamaAnswerProvider:
    """Create a provider without depending on local environment values."""

    return OllamaAnswerProvider(
        base_url="http://ollama.test",
        model="controlled-test-model",
        timeout_seconds=5,
    )


def run_generation(
    provider: OllamaAnswerProvider,
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
) -> None:
    """Replace the real HTTP client with a controlled fake."""

    def fake_client_factory(
        **kwargs: Any,
    ) -> FakeAsyncClient:
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


def test_generate_returns_ollama_content(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    captured_request: dict[str, Any] = {}

    install_fake_client(
        monkeypatch,
        response=FakeResponse(
            payload={
                "message": {
                    "role": "assistant",
                    "content": "Grounded NEXORA answer.",
                }
            }
        ),
        captured_request=captured_request,
    )

    answer = run_generation(
        create_provider()
    )

    assert answer == "Grounded NEXORA answer."
    assert captured_request["endpoint"] == "/api/chat"

    payload = captured_request["payload"]

    assert payload["model"] == "controlled-test-model"
    assert payload["stream"] is False
    assert payload["think"] is False
    assert payload["options"]["temperature"] == 0.0
    assert payload["messages"][0]["role"] == "system"
    assert payload["messages"][1]["role"] == "user"


def test_generate_rejects_empty_system_prompt() -> None:
    with pytest.raises(
        ValueError,
        match="System prompt must not be empty",
    ):
        run_generation(
            create_provider(),
            system_prompt=" ",
        )


def test_generate_rejects_empty_user_prompt() -> None:
    with pytest.raises(
        ValueError,
        match="User prompt must not be empty",
    ):
        run_generation(
            create_provider(),
            user_prompt=" ",
        )


def test_generate_handles_timeout(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    request = httpx.Request(
        "POST",
        "http://ollama.test/api/chat",
    )

    install_fake_client(
        monkeypatch,
        error=httpx.ReadTimeout(
            "Controlled timeout.",
            request=request,
        ),
    )

    with pytest.raises(
        OllamaProviderError,
        match="did not respond",
    ):
        run_generation(create_provider())


def test_generate_handles_connection_failure(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    request = httpx.Request(
        "POST",
        "http://ollama.test/api/chat",
    )

    install_fake_client(
        monkeypatch,
        error=httpx.ConnectError(
            "Controlled connection failure.",
            request=request,
        ),
    )

    with pytest.raises(
        OllamaProviderError,
        match="could not connect",
    ):
        run_generation(create_provider())


def test_generate_handles_http_failure(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    install_fake_client(
        monkeypatch,
        response=FakeResponse(
            status_code=500,
        ),
    )

    with pytest.raises(
        OllamaProviderError,
        match="HTTP 500",
    ):
        run_generation(create_provider())


def test_generate_rejects_invalid_json(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    install_fake_client(
        monkeypatch,
        response=FakeResponse(
            invalid_json=True,
        ),
    )

    with pytest.raises(
        OllamaProviderError,
        match="invalid JSON",
    ):
        run_generation(create_provider())


def test_generate_rejects_missing_message(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    install_fake_client(
        monkeypatch,
        response=FakeResponse(
            payload={},
        ),
    )

    with pytest.raises(
        OllamaProviderError,
        match="does not contain a message",
    ):
        run_generation(create_provider())


def test_generate_rejects_empty_answer(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    install_fake_client(
        monkeypatch,
        response=FakeResponse(
            payload={
                "message": {
                    "role": "assistant",
                    "content": " ",
                }
            }
        ),
    )

    with pytest.raises(
        OllamaProviderError,
        match="empty answer",
    ):
        run_generation(create_provider())