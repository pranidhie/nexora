"""Provider contract for NEXORA AI text generation."""

from __future__ import annotations

from typing import Protocol


class AnswerProvider(Protocol):
    """Contract implemented by an external LLM provider."""

    async def generate(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
    ) -> str:
        """Generate one raw answer from controlled prompts."""