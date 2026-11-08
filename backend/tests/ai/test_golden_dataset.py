"""Tests for the controlled NEXORA golden dataset."""

import json
from pathlib import Path

import pytest

from app.ai.evaluation.golden import (
    GoldenDatasetError,
    load_golden_dataset,
)


def build_minimum_dataset() -> dict:
    """Build a minimal valid dataset for validation tests."""

    return {
        "dataset_id": "TEST-DATASET-001",
        "dataset_version": "1.0",
        "title": "Test golden dataset",
        "description": "Controlled test dataset.",
        "status": "baseline",
        "source_scope": [
            {
                "source_id": "SOURCE-001",
                "path": "docs/test.md",
                "git_blob_sha": "test-sha",
            }
        ],
        "evaluation_dimensions": [
            "retrieval_relevance"
        ],
        "cases": [
            {
                "case_id": "TEST-001",
                "category": "factual_retrieval",
                "question": "What is tested?",
                "expected_behavior": "answer",
                "reference_answer": (
                    "The approved functionality is tested."
                ),
                "expected_source_ids": [
                    "SOURCE-001"
                ],
                "expected_answer_must_include": [
                    "functionality"
                ],
                "forbidden_claims": [],
                "tags": [
                    "test"
                ],
            }
        ],
    }


def write_dataset(
    tmp_path: Path,
    dataset: dict,
) -> Path:
    """Write a temporary golden dataset."""

    dataset_path = (
        tmp_path
        / "golden-dataset.json"
    )

    dataset_path.write_text(
        json.dumps(dataset),
        encoding="utf-8",
    )

    return dataset_path


def test_project_golden_dataset_is_valid() -> None:
    dataset = load_golden_dataset()

    assert (
        dataset.dataset_id
        == "NEXORA-AI-QA-GOLDEN-001"
    )

    assert len(dataset.cases) == 12

    behaviour_counts = {
        behaviour: sum(
            case.expected_behavior == behaviour
            for case in dataset.cases
        )
        for behaviour in {
            "answer",
            "insufficient_evidence",
            "refuse",
        }
    }

    assert behaviour_counts == {
        "answer": 9,
        "insufficient_evidence": 2,
        "refuse": 1,
    }


def test_duplicate_case_ids_are_rejected(
    tmp_path: Path,
) -> None:
    dataset = build_minimum_dataset()

    dataset["cases"].append(
        dict(dataset["cases"][0])
    )

    dataset_path = write_dataset(
        tmp_path,
        dataset,
    )

    with pytest.raises(
        GoldenDatasetError,
        match="duplicate case IDs",
    ):
        load_golden_dataset(
            dataset_path=dataset_path
        )


def test_unsupported_behaviour_is_rejected(
    tmp_path: Path,
) -> None:
    dataset = build_minimum_dataset()

    dataset["cases"][0][
        "expected_behavior"
    ] = "invent_answer"

    dataset_path = write_dataset(
        tmp_path,
        dataset,
    )

    with pytest.raises(
        GoldenDatasetError,
        match="unsupported expected_behavior",
    ):
        load_golden_dataset(
            dataset_path=dataset_path
        )


def test_answer_case_requires_expected_source(
    tmp_path: Path,
) -> None:
    dataset = build_minimum_dataset()

    dataset["cases"][0][
        "expected_source_ids"
    ] = []

    dataset_path = write_dataset(
        tmp_path,
        dataset,
    )

    with pytest.raises(
        GoldenDatasetError,
        match="at least one expected source",
    ):
        load_golden_dataset(
            dataset_path=dataset_path
        )


def test_abstention_case_cannot_expect_source(
    tmp_path: Path,
) -> None:
    dataset = build_minimum_dataset()

    dataset["cases"][0][
        "expected_behavior"
    ] = "insufficient_evidence"

    dataset_path = write_dataset(
        tmp_path,
        dataset,
    )

    with pytest.raises(
        GoldenDatasetError,
        match="must not identify an expected source",
    ):
        load_golden_dataset(
            dataset_path=dataset_path
        )