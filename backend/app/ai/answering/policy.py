"""Deterministic safety policy for NEXORA AI questions."""

from __future__ import annotations

import re
from dataclasses import dataclass
from enum import Enum

from app.ai.answering.models import (
    AnswerStatus,
    GroundedAnswer,
)


MAX_QUERY_CHARACTERS = 1_000

PROMPT_INJECTION_PATTERNS = (
    re.compile(
        r"\bignore\s+(all\s+)?previous\s+instructions\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\bignore\s+(the\s+)?system\s+(prompt|message)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\breveal\s+(the\s+)?system\s+prompt\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\boverride\s+(the\s+)?instructions\b",
        re.IGNORECASE,
    ),
)

SENSITIVE_VALUE_PATTERN = re.compile(
    r"\b("
    r"password|"
    r"access[\s_-]?token|"
    r"refresh[\s_-]?token|"
    r"jwt[\s_-]?secret|"
    r"secret[\s_-]?key|"
    r"api[\s_-]?key|"
    r"database[\s_-]?(password|credential)|"
    r"admin[\s_-]?credential"
    r")s?\b",
    re.IGNORECASE,
)

EXTRACTION_ACTION_PATTERN = re.compile(
    r"\b("
    r"show|"
    r"give|"
    r"tell|"
    r"provide|"
    r"reveal|"
    r"display|"
    r"print|"
    r"extract|"
    r"retrieve|"
    r"expose"
    r")\b",
    re.IGNORECASE,
)


class QueryPolicyDecision(str, Enum):
    """Possible deterministic query-policy decisions."""

    ALLOW = "allow"
    REFUSE = "refuse"


@dataclass(frozen=True)
class QueryPolicyResult:
    """Result returned by the deterministic query policy."""

    decision: QueryPolicyDecision
    reason: str | None = None

    @property
    def is_allowed(self) -> bool:
        """Return whether processing may continue."""

        return self.decision == QueryPolicyDecision.ALLOW


class QueryPolicyError(ValueError):
    """Raised when a query cannot be assessed safely."""


def assess_query_policy(
    query: str,
) -> QueryPolicyResult:
    """Assess whether a question may enter the RAG pipeline."""

    if not isinstance(query, str) or not query.strip():
        raise QueryPolicyError(
            "Query must be a non-empty string."
        )

    cleaned_query = query.strip()

    if len(cleaned_query) > MAX_QUERY_CHARACTERS:
        raise QueryPolicyError(
            f"Query exceeds the "
            f"{MAX_QUERY_CHARACTERS}-character limit."
        )

    for pattern in PROMPT_INJECTION_PATTERNS:
        if pattern.search(cleaned_query):
            return QueryPolicyResult(
                decision=QueryPolicyDecision.REFUSE,
                reason=(
                    "The query contains a prompt-injection "
                    "instruction."
                ),
            )

    requests_sensitive_value = (
        SENSITIVE_VALUE_PATTERN.search(cleaned_query)
        is not None
        and EXTRACTION_ACTION_PATTERN.search(cleaned_query)
        is not None
    )

    if requests_sensitive_value:
        return QueryPolicyResult(
            decision=QueryPolicyDecision.REFUSE,
            reason=(
                "The query requests credentials, secrets, "
                "or restricted configuration values."
            ),
        )

    return QueryPolicyResult(
        decision=QueryPolicyDecision.ALLOW,
    )


def build_policy_refusal(
    query: str,
    policy_result: QueryPolicyResult,
) -> GroundedAnswer:
    """Create a controlled refusal from a policy result."""

    if policy_result.decision != QueryPolicyDecision.REFUSE:
        raise QueryPolicyError(
            "A refusal can only be built from a REFUSE decision."
        )

    return GroundedAnswer(
        query=query.strip(),
        status=AnswerStatus.REFUSE,
        answer=(
            "I cannot provide credentials, secrets, restricted "
            "configuration, or follow instructions that attempt "
            "to override the approved NEXORA AI policy."
        ),
        reason=policy_result.reason,
    )