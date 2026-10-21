"""Tests for golden-dataset retrieval evaluation."""

import pytest

from app.ai.evaluation.golden import (
    GoldenDataset,
    GoldenEvaluationCase,
    load_golden_dataset,
)
from app.ai.evaluation.retrieval import (
    RetrievalEvaluationError,
    evaluate_retrieval,
)
from app.ai.ingestion.chunker import (
    chunk_documents,
)
from app.ai.ingestion.extractors import (
    extract_manifest_documents,
)
from app.ai.ingestion.manifest import (
    load_knowledge_manifest,
)
from app.ai.ingestion.models import (
    KnowledgeChunk,
)
from app.ai.retrieval.lexical import (
    LexicalRetriever,
)


def build_chunk(
    *,
    chunk_id: str,
    source_id: str,
    text: str,
) -> KnowledgeChunk:
    """Build one controlled retrieval chunk."""

    return KnowledgeChunk(
        chunk_id=chunk_id,
        source_id=source_id,
        document_title="Test source",
        relative_path="docs/test.md",
        format="markdown",
        document_type="test_document",
        phase="phase-1",
        domain="procurement",
        classification="PUBLIC_SANITISED",
        tags=("test",),
        file_sha256="file-hash",
        section_id=f"{source_id}:section:1",
        section_title="Test section",
        locator="markdown:line:1",
        chunk_index=1,
        text=text,
        content_sha256="content-hash",
    )


def build_case(
    *,
    case_id: str = "CASE-001",
    expected_behavior: str = "answer",
    expected_source_ids: tuple[str, ...] = (
        "EXPECTED-SOURCE",
    ),
) -> GoldenEvaluationCase:
    """Build one controlled golden case."""

    return GoldenEvaluationCase(
        case_id=case_id,
        category="factual_retrieval",
        question=(
            "How does inventory balance "
            "verification work?"
        ),
        expected_behavior=expected_behavior,
        reference_answer=(
            "Inventory balance verification "
            "is included."
        ),
        expected_source_ids=expected_source_ids,
        expected_answer_must_include=(
            "inventory balance",
        ),
        forbidden_claims=(),
        tags=("inventory",),
    )


def build_dataset(
    cases: tuple[
        GoldenEvaluationCase,
        ...
    ],
) -> GoldenDataset:
    """Build a controlled golden dataset."""

    return GoldenDataset(
        dataset_id="TEST-DATASET-001",
        dataset_version="1.0",
        title="Test dataset",
        description="Retrieval evaluation test.",
        status="baseline",
        source_ids=("EXPECTED-SOURCE",),
        evaluation_dimensions=(
            "retrieval_relevance",
        ),
        cases=cases,
    )


def test_expected_source_produces_hit() -> None:
    retriever = LexicalRetriever(
        (
            build_chunk(
                chunk_id="chunk-001",
                source_id="OTHER-SOURCE",
                text=(
                    "Supplier creation and "
                    "supplier retrieval."
                ),
            ),
            build_chunk(
                chunk_id="chunk-002",
                source_id="EXPECTED-SOURCE",
                text=(
                    "Inventory balance verification "
                    "checks database updates."
                ),
            ),
        )
    )

    report = evaluate_retrieval(
        build_dataset(
            (
                build_case(),
            )
        ),
        retriever,
        top_k=2,
    )

    assert report.evaluated_case_count == 1
    assert report.hit_count == 1
    assert report.miss_count == 0
    assert report.hit_rate == 1.0
    assert (
        report.case_results[0]
        .first_relevant_rank
        == 1
    )
    assert (
        report.case_results[0]
        .reciprocal_rank
        == 1.0
    )


def test_missing_source_produces_miss() -> None:
    retriever = LexicalRetriever(
        (
            build_chunk(
                chunk_id="chunk-001",
                source_id="OTHER-SOURCE",
                text=(
                    "Inventory balance verification "
                    "checks database updates."
                ),
            ),
        )
    )

    report = evaluate_retrieval(
        build_dataset(
            (
                build_case(),
            )
        ),
        retriever,
    )

    assert report.hit_count == 0
    assert report.miss_count == 1
    assert report.hit_rate == 0.0
    assert (
        report.case_results[0]
        .first_relevant_rank
        is None
    )
    assert (
        report.case_results[0]
        .reciprocal_rank
        == 0.0
    )


def test_only_answerable_cases_are_evaluated() -> None:
    answer_case = build_case(
        case_id="ANSWER-001",
    )

    refusal_case = build_case(
        case_id="REFUSE-001",
        expected_behavior="refuse",
        expected_source_ids=(),
    )

    retriever = LexicalRetriever(
        (
            build_chunk(
                chunk_id="chunk-001",
                source_id="EXPECTED-SOURCE",
                text=(
                    "Inventory balance verification "
                    "checks database updates."
                ),
            ),
        )
    )

    report = evaluate_retrieval(
        build_dataset(
            (
                answer_case,
                refusal_case,
            )
        ),
        retriever,
    )

    assert report.evaluated_case_count == 1
    assert (
        report.case_results[0].case_id
        == "ANSWER-001"
    )


def test_invalid_top_k_is_rejected() -> None:
    retriever = LexicalRetriever(
        (
            build_chunk(
                chunk_id="chunk-001",
                source_id="EXPECTED-SOURCE",
                text="Inventory verification.",
            ),
        )
    )

    with pytest.raises(
        RetrievalEvaluationError,
        match="top_k must be between",
    ):
        evaluate_retrieval(
            build_dataset(
                (
                    build_case(),
                )
            ),
            retriever,
            top_k=0,
        )


def test_real_knowledge_pipeline_can_be_measured() -> None:
    manifest = load_knowledge_manifest()

    documents = extract_manifest_documents(
        manifest
    )

    chunks = chunk_documents(
        documents
    )

    retriever = LexicalRetriever(
        chunks
    )

    dataset = load_golden_dataset()

    report = evaluate_retrieval(
        dataset,
        retriever,
        top_k=5,
    )

    assert report.dataset_id == (
        "NEXORA-AI-QA-GOLDEN-001"
    )

    assert report.evaluated_case_count == 9

    assert (
        report.hit_count
        + report.miss_count
        == 9
    )

    assert 0.0 <= report.hit_rate <= 1.0

    assert (
        0.0
        <= report.mean_reciprocal_rank
        <= 1.0
    )

    assert len(report.case_results) == 9