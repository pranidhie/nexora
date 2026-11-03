"""Create the configured NEXORA grounded-answer service."""

from __future__ import annotations

from functools import lru_cache

from app.ai.answering.provider_factory import (
    create_answer_provider,
)
from app.ai.answering.service import (
    GroundedAnswerService,
)
from app.ai.knowledge_base import (
    get_knowledge_base,
)


@lru_cache(maxsize=1)
def get_grounded_answer_service() -> GroundedAnswerService:
    """Create and cache the complete grounded-answer service."""

    knowledge_base = get_knowledge_base()

    provider = create_answer_provider()

    return GroundedAnswerService(
        retriever=knowledge_base.retriever,
        provider=provider,
        allowed_source_ids=(
            knowledge_base.allowed_source_ids
        ),
    )