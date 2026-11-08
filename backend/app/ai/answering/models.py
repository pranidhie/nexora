"""Domain models for grounded AI answers."""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class AnswerStatus(str, Enum):
    """Supported outcomes from the grounded answer service."""

    ANSWER = "answer"
    INSUFFICIENT_EVIDENCE = "insufficient_evidence"
    REFUSE = "refuse"


@dataclass(frozen=True)
class AnswerCitation:
    """Reference to an approved knowledge chunk."""

    source_id: str
    chunk_id: str
    section: str
    locator: str
    excerpt: str

    def __post_init__(self) -> None:
        """Validate required citation information."""

        required_fields = {
            "source_id": self.source_id,
            "chunk_id": self.chunk_id,
            "section": self.section,
            "locator": self.locator,
            "excerpt": self.excerpt,
        }

        for field_name, value in required_fields.items():
            if not value.strip():
                raise ValueError(
                    f"{field_name} must be a non-empty string."
                )


@dataclass(frozen=True)
class GroundedAnswer:
    """Controlled answer returned by the NEXORA QA assistant."""

    query: str
    status: AnswerStatus
    answer: str
    citations: tuple[AnswerCitation, ...] = ()
    reason: str | None = None

    def __post_init__(self) -> None:
        """Validate the relationship between status and evidence."""

        if not self.query.strip():
            raise ValueError(
                "query must be a non-empty string."
            )

        if not self.answer.strip():
            raise ValueError(
                "answer must be a non-empty string."
            )

        if (
            self.status == AnswerStatus.ANSWER
            and not self.citations
        ):
            raise ValueError(
                "An answer must include at least one citation."
            )

        if (
            self.status
            in {
                AnswerStatus.INSUFFICIENT_EVIDENCE,
                AnswerStatus.REFUSE,
            }
            and self.citations
        ):
            raise ValueError(
                f"{self.status.value} responses must not "
                f"include citations."
            )

        if self.reason is not None and not self.reason.strip():
            raise ValueError(
                "reason cannot be blank when provided."
            )