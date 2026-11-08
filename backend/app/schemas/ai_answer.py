"""API schemas for grounded NEXORA AI answers."""

from __future__ import annotations

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
)

from app.ai.answering.models import AnswerStatus


MAX_AI_QUERY_CHARACTERS = 1_000


class AIQuestionRequest(BaseModel):
    """Question submitted to the NEXORA AI assistant."""

    query: str = Field(
        min_length=3,
        max_length=MAX_AI_QUERY_CHARACTERS,
        examples=[
            (
                "How many traceable requirements are "
                "included in the Phase 1 baseline?"
            )
        ],
    )

    @field_validator("query")
    @classmethod
    def validate_query(cls, value: str) -> str:
        """Remove surrounding whitespace and reject blank queries."""

        normalised_query = value.strip()

        if len(normalised_query) < 3:
            raise ValueError(
                "query must contain at least 3 "
                "non-whitespace characters."
            )

        return normalised_query


class AIAnswerCitationResponse(BaseModel):
    """Approved evidence supporting a grounded answer."""

    model_config = ConfigDict(
        from_attributes=True
    )

    source_id: str
    chunk_id: str
    section: str
    locator: str
    excerpt: str


class AIAnswerResponse(BaseModel):
    """Validated response returned by the AI assistant."""

    model_config = ConfigDict(
        from_attributes=True
    )

    query: str
    status: AnswerStatus
    answer: str
    citations: list[AIAnswerCitationResponse]
    reason: str | None = None