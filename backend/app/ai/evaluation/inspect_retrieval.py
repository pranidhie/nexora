"""Inspect ranked knowledge chunks for one golden evaluation case."""

from __future__ import annotations

import argparse

from app.ai.evaluation.golden import (
    load_golden_dataset,
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


def build_argument_parser() -> argparse.ArgumentParser:
    """Create command-line arguments for retrieval inspection."""

    parser = argparse.ArgumentParser(
        description=(
            "Inspect ranked NEXORA knowledge chunks "
            "for one golden evaluation case."
        )
    )

    parser.add_argument(
        "case_id",
        help="Golden evaluation case ID.",
    )

    parser.add_argument(
        "--top-k",
        type=int,
        default=10,
        help="Number of ranked chunks to display.",
    )

    return parser


def create_excerpt(
    text: str,
    maximum_characters: int = 350,
) -> str:
    """Create a readable single-line chunk excerpt."""

    normalised_text = " ".join(
        text.split()
    )

    if len(normalised_text) <= maximum_characters:
        return normalised_text

    return (
        normalised_text[
            :maximum_characters
        ].rstrip()
        + "..."
    )


def main() -> None:
    """Inspect retrieval evidence for one golden case."""

    arguments = (
        build_argument_parser()
        .parse_args()
    )

    dataset = load_golden_dataset()

    matching_case = next(
        (
            case
            for case in dataset.cases
            if case.case_id == arguments.case_id
        ),
        None,
    )

    if matching_case is None:
        available_case_ids = ", ".join(
            case.case_id
            for case in dataset.cases
        )

        raise SystemExit(
            f"Unknown case ID: {arguments.case_id}. "
            f"Available cases: {available_case_ids}"
        )

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

    results = retriever.search(
        matching_case.question,
        top_k=arguments.top_k,
    )

    print()
    print("=" * 72)
    print(
        f"RETRIEVAL INSPECTION: "
        f"{matching_case.case_id}"
    )
    print("=" * 72)
    print(
        f"Question: {matching_case.question}"
    )
    print(
        "Expected sources: "
        + (
            ", ".join(
                matching_case.expected_source_ids
            )
            if matching_case.expected_source_ids
            else "None"
        )
    )
    print(
        f"Requested top-k: {arguments.top_k}"
    )
    print(
        f"Results returned: {len(results)}"
    )

    for rank, result in enumerate(
        results,
        start=1,
    ):
        chunk = result.chunk

        print()
        print("-" * 72)
        print(
            f"Rank {rank} | "
            f"Score {result.score:.6f}"
        )
        print(
            f"Source: {chunk.source_id}"
        )
        print(
            f"Chunk: {chunk.chunk_id}"
        )
        print(
            f"Section: {chunk.section_title}"
        )
        print(
            f"Locator: {chunk.locator}"
        )
        print(
            "Matched terms: "
            + ", ".join(
                result.matched_terms
            )
        )
        print(
            f"Evidence: "
            f"{create_excerpt(chunk.text)}"
        )

    print()
    print("=" * 72)


if __name__ == "__main__":
    main()