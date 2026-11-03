"""Tests for the NEXORA AI API schemas."""

import pytest
from pydantic import ValidationError

from app.ai.answering.models import (
    AnswerCitation,
    AnswerStatus,
    GroundedAnswer,
)
from app.schemas.ai_answer import (
    AIAnswerResponse,
    AIQuestionRequest,
    MAX_AI_QUERY_CHARACTERS,
)


def test_question_request_strips_whitespace() -> None:
    request = AIQuestionRequest(
        query="  What is the Phase 1 baseline?  "
    )

    assert request.query == (
        "What is the Phase 1 baseline?"
    )


def test_question_request_rejects_blank_query() -> None:
    with pytest.raises(ValidationError):
        AIQuestionRequest(
            query="   "
        )


def test_question_request_rejects_oversized_query() -> None:
    with pytest.raises(ValidationError):
        AIQuestionRequest(
            query=(
                "x"
                * (
                    MAX_AI_QUERY_CHARACTERS
                    + 1
                )
            )
        )


def test_answer_response_converts_grounded_answer() -> None:
    grounded_answer = GroundedAnswer(
        query=(
            "How many traceable requirements "
            "are included?"
        ),
        status=AnswerStatus.ANSWER,
        answer=(
            "The baseline includes "
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

    response = AIAnswerResponse.model_validate(
        grounded_answer
    )

    assert response.status == AnswerStatus.ANSWER
    assert response.answer == (
        "The baseline includes "
        "46 traceable requirements."
    )
    assert len(response.citations) == 1
    assert response.citations[0].source_id == (
        "NEXORA-QE-README-001"
    )