"""API tests for the NEXORA AI answer endpoint."""

from fastapi import FastAPI
from fastapi.testclient import TestClient
import pytest

import app.api.ai_answer as ai_answer_module
from app.ai.answering.models import (
    AnswerCitation,
    AnswerStatus,
    GroundedAnswer,
)
from app.ai.answering.ollama_provider import (
    OllamaProviderError,
)
from app.ai.answering.responses import (
    ModelResponseError,
)
from app.api.ai_answer import router
from app.dependencies.auth import get_current_user


QUESTION = (
    "How many traceable requirements are "
    "included in the Phase 1 baseline?"
)


class StubAnswerService:
    """Controlled answer service used by endpoint tests."""

    def __init__(
        self,
        *,
        result: GroundedAnswer | None = None,
        error: Exception | None = None,
    ) -> None:
        self.result = result
        self.error = error

    async def answer(
        self,
        query: str,
    ) -> GroundedAnswer:
        if self.error is not None:
            raise self.error

        if self.result is None:
            raise AssertionError(
                "A stub result was not configured."
            )

        return self.result


def create_test_client(
    *,
    authenticated: bool,
) -> TestClient:
    """Create an isolated FastAPI application for testing."""

    test_app = FastAPI()
    test_app.include_router(router)

    if authenticated:
        test_app.dependency_overrides[
            get_current_user
        ] = lambda: {
            "sub": "1",
            "role": "ADMIN",
        }

    return TestClient(test_app)


def create_grounded_answer() -> GroundedAnswer:
    """Create a successful answer with approved evidence."""

    return GroundedAnswer(
        query=QUESTION,
        status=AnswerStatus.ANSWER,
        answer=(
            "The Phase 1 baseline includes "
            "46 traceable requirements."
        ),
        citations=(
            AnswerCitation(
                source_id=(
                    "NEXORA-QE-README-001"
                ),
                chunk_id=(
                    "NEXORA-QE-README-001:"
                    "section:4:chunk:0001"
                ),
                section=(
                    "Test Design Baseline"
                ),
                locator=(
                    "markdown:line:24"
                ),
                excerpt=(
                    "46 traceable requirements"
                ),
            ),
        ),
    )


def test_ask_requires_authentication() -> None:
    client = create_test_client(
        authenticated=False
    )

    response = client.post(
        "/api/v1/ai/ask",
        json={
            "query": QUESTION,
        },
    )

    assert response.status_code == 401
    assert response.json()["detail"] == (
        "Invalid or missing authentication token"
    )


def test_ask_returns_grounded_answer(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    service = StubAnswerService(
        result=create_grounded_answer()
    )

    monkeypatch.setattr(
        ai_answer_module,
        "get_grounded_answer_service",
        lambda: service,
    )

    client = create_test_client(
        authenticated=True
    )

    response = client.post(
        "/api/v1/ai/ask",
        json={
            "query": QUESTION,
        },
    )

    assert response.status_code == 200

    response_body = response.json()

    assert response_body["status"] == "answer"
    assert response_body["answer"] == (
        "The Phase 1 baseline includes "
        "46 traceable requirements."
    )
    assert len(response_body["citations"]) == 1
    assert (
        response_body["citations"][0]["source_id"]
        == "NEXORA-QE-README-001"
    )


def test_ask_returns_insufficient_evidence(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    service = StubAnswerService(
        result=GroundedAnswer(
            query=QUESTION,
            status=(
                AnswerStatus.INSUFFICIENT_EVIDENCE
            ),
            answer=(
                "The answer cannot be confirmed from "
                "the approved NEXORA knowledge."
            ),
            citations=(),
            reason=(
                "No approved supporting evidence "
                "was retrieved."
            ),
        )
    )

    monkeypatch.setattr(
        ai_answer_module,
        "get_grounded_answer_service",
        lambda: service,
    )

    client = create_test_client(
        authenticated=True
    )

    response = client.post(
        "/api/v1/ai/ask",
        json={
            "query": QUESTION,
        },
    )

    assert response.status_code == 200

    response_body = response.json()

    assert response_body["status"] == (
        "insufficient_evidence"
    )
    assert response_body["citations"] == []
    assert response_body["reason"] is not None


def test_ask_rejects_blank_query() -> None:
    client = create_test_client(
        authenticated=True
    )

    response = client.post(
        "/api/v1/ai/ask",
        json={
            "query": "   ",
        },
    )

    assert response.status_code == 422


def test_ask_returns_503_when_ollama_is_unavailable(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    service = StubAnswerService(
        error=OllamaProviderError(
            "Ollama is unavailable."
        )
    )

    monkeypatch.setattr(
        ai_answer_module,
        "get_grounded_answer_service",
        lambda: service,
    )

    client = create_test_client(
        authenticated=True
    )

    response = client.post(
        "/api/v1/ai/ask",
        json={
            "query": QUESTION,
        },
    )

    assert response.status_code == 503
    assert response.json()["detail"] == (
        "The AI answer service is temporarily "
        "unavailable. Please try again later."
    )


def test_ask_returns_502_for_invalid_model_response(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    service = StubAnswerService(
        error=ModelResponseError(
            "Invalid model response."
        )
    )

    monkeypatch.setattr(
        ai_answer_module,
        "get_grounded_answer_service",
        lambda: service,
    )

    client = create_test_client(
        authenticated=True
    )

    response = client.post(
        "/api/v1/ai/ask",
        json={
            "query": QUESTION,
        },
    )

    assert response.status_code == 502
    assert response.json()["detail"] == (
        "The AI provider returned an invalid "
        "response."
    )