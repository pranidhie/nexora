"""Measure retrieval quality using the controlled golden dataset."""

from __future__ import annotations

from dataclasses import dataclass

from app.ai.evaluation.golden import (
    GoldenDataset,
    GoldenEvaluationCase,
)
from app.ai.retrieval.lexical import LexicalRetriever


MAX_EVALUATION_TOP_K = 20


class RetrievalEvaluationError(ValueError):
    """Raised when retrieval evaluation cannot be performed."""


@dataclass(frozen=True)
class RetrievalCaseResult:
    """Retrieval result for one golden evaluation case."""

    case_id: str
    question: str
    expected_source_ids: tuple[str, ...]
    retrieved_source_ids: tuple[str, ...]
    first_relevant_rank: int | None
    hit: bool
    reciprocal_rank: float


@dataclass(frozen=True)
class RetrievalEvaluationReport:
    """Aggregated retrieval-quality measurements."""

    dataset_id: str
    dataset_version: str
    top_k: int
    evaluated_case_count: int
    hit_count: int
    miss_count: int
    hit_rate: float
    mean_reciprocal_rank: float
    case_results: tuple[RetrievalCaseResult, ...]


def _unique_source_ids(
    source_ids: tuple[str, ...],
) -> tuple[str, ...]:
    """Remove duplicate source IDs while preserving rank order."""

    unique_ids: list[str] = []
    seen_ids: set[str] = set()

    for source_id in source_ids:
        if source_id in seen_ids:
            continue

        seen_ids.add(source_id)
        unique_ids.append(source_id)

    return tuple(unique_ids)


def _first_relevant_rank(
    retrieved_source_ids: tuple[str, ...],
    expected_source_ids: tuple[str, ...],
) -> int | None:
    """Return the one-based rank of the first expected source."""

    expected_sources = set(expected_source_ids)

    for rank, source_id in enumerate(
        retrieved_source_ids,
        start=1,
    ):
        if source_id in expected_sources:
            return rank

    return None


def evaluate_retrieval_case(
    case: GoldenEvaluationCase,
    retriever: LexicalRetriever,
    *,
    top_k: int,
    allowed_source_ids: tuple[str, ...] | None = None,
) -> RetrievalCaseResult:
    """Evaluate retrieval for one answerable golden case."""

    if case.expected_behavior != "answer":
        raise RetrievalEvaluationError(
            f"{case.case_id} is not an answerable "
            f"retrieval case."
        )

    search_top_k = (
        MAX_EVALUATION_TOP_K
        if allowed_source_ids is not None
        else top_k
    )

    retrieval_results = retriever.search(
        case.question,
        top_k=search_top_k,
    )

    if allowed_source_ids is not None:
        allowed_sources = set(allowed_source_ids)

        retrieval_results = tuple(
            result
            for result in retrieval_results
            if result.chunk.source_id in allowed_sources
        )

    retrieval_results = retrieval_results[:top_k]

    retrieved_source_ids = _unique_source_ids(
        tuple(
            result.chunk.source_id
            for result in retrieval_results
        )
    )

    relevant_rank = _first_relevant_rank(
        retrieved_source_ids,
        case.expected_source_ids,
    )

    hit = relevant_rank is not None

    reciprocal_rank = (
        1.0 / relevant_rank
        if relevant_rank is not None
        else 0.0
    )

    return RetrievalCaseResult(
        case_id=case.case_id,
        question=case.question,
        expected_source_ids=(
            case.expected_source_ids
        ),
        retrieved_source_ids=(
            retrieved_source_ids
        ),
        first_relevant_rank=relevant_rank,
        hit=hit,
        reciprocal_rank=round(
            reciprocal_rank,
            6,
        ),
    )


def evaluate_retrieval(
    dataset: GoldenDataset,
    retriever: LexicalRetriever,
    *,
    top_k: int = 5,
) -> RetrievalEvaluationReport:
    """Evaluate answerable cases and calculate retrieval metrics."""

    if (
        top_k < 1
        or top_k > MAX_EVALUATION_TOP_K
    ):
        raise RetrievalEvaluationError(
            f"top_k must be between 1 and "
            f"{MAX_EVALUATION_TOP_K}."
        )

    answerable_cases = tuple(
        case
        for case in dataset.cases
        if case.expected_behavior == "answer"
    )

    if not answerable_cases:
        raise RetrievalEvaluationError(
            "Golden dataset contains no answerable cases."
        )

    case_results = tuple(
        evaluate_retrieval_case(
            case,
            retriever,
            top_k=top_k,
            allowed_source_ids=dataset.source_ids,
        )
        for case in answerable_cases
    )

    hit_count = sum(
        result.hit
        for result in case_results
    )

    evaluated_case_count = len(
        case_results
    )

    hit_rate = (
        hit_count
        / evaluated_case_count
    )

    mean_reciprocal_rank = (
        sum(
            result.reciprocal_rank
            for result in case_results
        )
        / evaluated_case_count
    )

    return RetrievalEvaluationReport(
        dataset_id=dataset.dataset_id,
        dataset_version=(
            dataset.dataset_version
        ),
        top_k=top_k,
        evaluated_case_count=(
            evaluated_case_count
        ),
        hit_count=hit_count,
        miss_count=(
            evaluated_case_count
            - hit_count
        ),
        hit_rate=round(
            hit_rate,
            6,
        ),
        mean_reciprocal_rank=round(
            mean_reciprocal_rank,
            6,
        ),
        case_results=case_results,
    )