"""Run the NEXORA lexical retrieval baseline evaluation."""

from __future__ import annotations

from app.ai.evaluation.golden import (
    load_golden_dataset,
)
from app.ai.evaluation.retrieval import (
    RetrievalEvaluationReport,
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
from app.ai.retrieval.lexical import (
    LexicalRetriever,
)


DEFAULT_TOP_K = 5


def print_report(
    report: RetrievalEvaluationReport,
) -> None:
    """Print a readable retrieval evaluation report."""

    print()
    print("=" * 64)
    print("NEXORA AI RETRIEVAL BASELINE")
    print("=" * 64)

    print(
        f"Dataset: {report.dataset_id} "
        f"v{report.dataset_version}"
    )
    print(
        f"Evaluation: Hit@{report.top_k}"
    )
    print(
        f"Cases evaluated: "
        f"{report.evaluated_case_count}"
    )
    print(
        f"Hits: {report.hit_count}"
    )
    print(
        f"Misses: {report.miss_count}"
    )
    print(
        f"Hit@{report.top_k}: "
        f"{report.hit_rate:.2%}"
    )
    print(
        f"Mean Reciprocal Rank: "
        f"{report.mean_reciprocal_rank:.4f}"
    )

    print()
    print("-" * 64)
    print("CASE RESULTS")
    print("-" * 64)

    for case_result in report.case_results:
        outcome = (
            "PASS"
            if case_result.hit
            else "MISS"
        )

        rank = (
            str(
                case_result.first_relevant_rank
            )
            if (
                case_result.first_relevant_rank
                is not None
            )
            else "N/A"
        )

        retrieved_sources = (
            ", ".join(
                case_result.retrieved_source_ids
            )
            if case_result.retrieved_source_ids
            else "No sources retrieved"
        )

        print()
        print(
            f"[{outcome}] "
            f"{case_result.case_id}"
        )
        print(
            f"Question: "
            f"{case_result.question}"
        )
        print(
            f"Expected sources: "
            f"{', '.join(case_result.expected_source_ids)}"
        )
        print(
            f"Retrieved sources: "
            f"{retrieved_sources}"
        )
        print(
            f"First relevant rank: {rank}"
        )

    print()
    print("=" * 64)


def main() -> None:
    """Build the real pipeline and print baseline metrics."""

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
        top_k=DEFAULT_TOP_K,
    )

    print(
        f"Approved documents: "
        f"{len(documents)}"
    )

    print(
        f"Knowledge chunks: "
        f"{len(chunks)}"
    )

    print_report(report)


if __name__ == "__main__":
    main()