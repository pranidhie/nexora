"""Protected API endpoint for grounded NEXORA AI answers."""

from __future__ import annotations

import logging

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Request,
    status,
)

from app.ai.answering.evidence import (
    EvidencePreparationError,
)
from app.ai.answering.gemini_provider import (
    GeminiProviderError,
)
from app.ai.answering.ollama_provider import (
    OllamaProviderError,
)
from app.ai.answering.policy import (
    QueryPolicyError,
)
from app.ai.answering.prompts import (
    PromptBuildingError,
)
from app.ai.answering.provider_factory import (
    AnswerProviderConfigurationError,
)
from app.ai.answering.responses import (
    ModelResponseError,
)
from app.ai.answering.service_factory import (
    get_grounded_answer_service,
)
from app.core.config import settings
from app.core.rate_limiter import (
    InMemoryRateLimiter,
    RateLimitExceededError,
)
from app.dependencies.auth import (
    get_current_user,
)
from app.schemas.ai_answer import (
    AIAnswerResponse,
    AIQuestionRequest,
)


logger = logging.getLogger(__name__)


ai_question_rate_limiter = InMemoryRateLimiter(
    max_requests=(
        settings.ai_rate_limit_requests
    ),
    window_seconds=(
        settings.ai_rate_limit_window_seconds
    ),
)


router = APIRouter(
    prefix="/api/v1/ai",
    tags=["AI Quality Assistant"],
    dependencies=[
        Depends(get_current_user),
    ],
)


def get_client_key(
    request: Request,
) -> str:
    """Resolve a stable client identifier for rate limiting."""

    forwarded_for = request.headers.get(
        "x-forwarded-for",
    )

    if forwarded_for:
        return (
            forwarded_for
            .split(",")[0]
            .strip()
        )

    real_ip = request.headers.get(
        "x-real-ip",
    )

    if real_ip:
        return real_ip.strip()

    if request.client:
        return request.client.host

    return "unknown-client"


async def enforce_ai_rate_limit(
    request: Request,
) -> None:
    """Apply the AI request limit in production environments."""

    if (
        settings.app_env
        .strip()
        .lower()
        != "production"
    ):
        return

    try:
        await ai_question_rate_limiter.check(
            get_client_key(
                request,
            ),
        )

    except RateLimitExceededError as error:
        raise HTTPException(
            status_code=(
                status.HTTP_429_TOO_MANY_REQUESTS
            ),
            detail=(
                "The public AI demonstration request "
                "limit has been reached. Please wait "
                "and try again."
            ),
            headers={
                "Retry-After": str(
                    error.retry_after_seconds,
                ),
            },
        ) from error


@router.post(
    "/ask",
    response_model=AIAnswerResponse,
    status_code=status.HTTP_200_OK,
)
async def ask_ai_question(
    question_data: AIQuestionRequest,
    _rate_limit: None = Depends(
        enforce_ai_rate_limit,
    ),
) -> AIAnswerResponse:
    """
    Answer a quality-engineering question using only approved evidence.
    """

    try:
        service = get_grounded_answer_service()

        grounded_answer = await service.answer(
            question_data.query
        )

    except (
        OllamaProviderError,
        GeminiProviderError,
        AnswerProviderConfigurationError,
    ) as error:
        logger.exception(
            "The AI answer provider is unavailable."
        )

        raise HTTPException(
            status_code=(
                status.HTTP_503_SERVICE_UNAVAILABLE
            ),
            detail=(
                "The AI answer service is temporarily "
                "unavailable. Please try again later."
            ),
        ) from error

    except ModelResponseError as error:
        logger.exception(
            "The AI provider returned an invalid response."
        )

        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=(
                "The AI provider returned an invalid "
                "response."
            ),
        ) from error

    except (
        EvidencePreparationError,
        QueryPolicyError,
        PromptBuildingError,
    ) as error:
        logger.exception(
            "The grounded-answer pipeline failed."
        )

        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=(
                "The grounded-answer workflow could "
                "not be completed."
            ),
        ) from error

    return AIAnswerResponse.model_validate(
        grounded_answer
    )