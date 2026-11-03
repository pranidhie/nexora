"""Protected API endpoint for grounded NEXORA AI answers."""

from __future__ import annotations

import logging

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)

from app.ai.answering.evidence import (
    EvidencePreparationError,
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
from app.dependencies.auth import get_current_user
from app.schemas.ai_answer import (
    AIAnswerResponse,
    AIQuestionRequest,
)


logger = logging.getLogger(__name__)


router = APIRouter(
    prefix="/api/v1/ai",
    tags=["AI Quality Assistant"],
    dependencies=[
        Depends(get_current_user),
    ],
)


@router.post(
    "/ask",
    response_model=AIAnswerResponse,
    status_code=status.HTTP_200_OK,
)
async def ask_ai_question(
    question_data: AIQuestionRequest,
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