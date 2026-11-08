"""Load and validate the NEXORA AI golden evaluation dataset."""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any


SUPPORTED_BEHAVIOURS = {
    "answer",
    "insufficient_evidence",
    "refuse",
}


class GoldenDatasetError(ValueError):
    """Raised when the golden dataset is invalid."""


@dataclass(frozen=True)
class GoldenEvaluationCase:
    """One controlled AI evaluation case."""

    case_id: str
    category: str
    question: str
    expected_behavior: str
    reference_answer: str
    expected_source_ids: tuple[str, ...]
    expected_answer_must_include: tuple[str, ...]
    forbidden_claims: tuple[str, ...]
    tags: tuple[str, ...]


@dataclass(frozen=True)
class GoldenDataset:
    """Validated collection of controlled evaluation cases."""

    dataset_id: str
    dataset_version: str
    title: str
    description: str
    status: str
    source_ids: tuple[str, ...]
    evaluation_dimensions: tuple[str, ...]
    cases: tuple[GoldenEvaluationCase, ...]


def get_repository_root() -> Path:
    """Return the NEXORA repository root."""

    return Path(__file__).resolve().parents[4]


def get_default_dataset_path(
    repository_root: Path,
) -> Path:
    """Return the default golden-dataset path."""

    return (
        repository_root
        / "docs"
        / "ai-quality"
        / "evaluation"
        / "golden-dataset-v1.json"
    )


def _require_string(
    value: Any,
    field_name: str,
) -> str:
    """Validate and normalise a required string."""

    if not isinstance(value, str) or not value.strip():
        raise GoldenDatasetError(
            f"{field_name} must be a non-empty string."
        )

    return value.strip()


def _require_string_array(
    value: Any,
    field_name: str,
    *,
    allow_empty: bool = True,
) -> tuple[str, ...]:
    """Validate an array containing only non-empty strings."""

    if not isinstance(value, list):
        raise GoldenDatasetError(
            f"{field_name} must be an array."
        )

    if not allow_empty and not value:
        raise GoldenDatasetError(
            f"{field_name} cannot be empty."
        )

    return tuple(
        _require_string(
            item,
            f"{field_name}[{index}]",
        )
        for index, item in enumerate(value)
    )


def _build_case(
    raw_case: Any,
    index: int,
    approved_source_ids: set[str],
) -> GoldenEvaluationCase:
    """Validate and create one golden evaluation case."""

    if not isinstance(raw_case, dict):
        raise GoldenDatasetError(
            f"cases[{index}] must be an object."
        )

    case_id = _require_string(
        raw_case.get("case_id"),
        f"cases[{index}].case_id",
    )

    expected_behavior = _require_string(
        raw_case.get("expected_behavior"),
        f"{case_id}.expected_behavior",
    )

    if expected_behavior not in SUPPORTED_BEHAVIOURS:
        raise GoldenDatasetError(
            f"{case_id} has unsupported expected_behavior: "
            f"{expected_behavior}"
        )

    expected_source_ids = _require_string_array(
        raw_case.get("expected_source_ids"),
        f"{case_id}.expected_source_ids",
    )

    unknown_source_ids = (
        set(expected_source_ids)
        - approved_source_ids
    )

    if unknown_source_ids:
        unknown_source_id = sorted(
            unknown_source_ids
        )[0]

        raise GoldenDatasetError(
            f"{case_id} references an unknown source_id: "
            f"{unknown_source_id}"
        )

    if (
        expected_behavior == "answer"
        and not expected_source_ids
    ):
        raise GoldenDatasetError(
            f"{case_id} must identify at least one "
            f"expected source."
        )

    if (
        expected_behavior
        in {
            "insufficient_evidence",
            "refuse",
        }
        and expected_source_ids
    ):
        raise GoldenDatasetError(
            f"{case_id} must not identify an expected "
            f"source for {expected_behavior} behaviour."
        )

    return GoldenEvaluationCase(
        case_id=case_id,
        category=_require_string(
            raw_case.get("category"),
            f"{case_id}.category",
        ),
        question=_require_string(
            raw_case.get("question"),
            f"{case_id}.question",
        ),
        expected_behavior=expected_behavior,
        reference_answer=_require_string(
            raw_case.get("reference_answer"),
            f"{case_id}.reference_answer",
        ),
        expected_source_ids=expected_source_ids,
        expected_answer_must_include=(
            _require_string_array(
                raw_case.get(
                    "expected_answer_must_include"
                ),
                (
                    f"{case_id}."
                    f"expected_answer_must_include"
                ),
                allow_empty=False,
            )
        ),
        forbidden_claims=_require_string_array(
            raw_case.get("forbidden_claims"),
            f"{case_id}.forbidden_claims",
        ),
        tags=_require_string_array(
            raw_case.get("tags"),
            f"{case_id}.tags",
            allow_empty=False,
        ),
    )


def load_golden_dataset(
    dataset_path: Path | None = None,
    repository_root: Path | None = None,
) -> GoldenDataset:
    """Load and validate the controlled golden dataset."""

    resolved_repository_root = (
        repository_root.resolve()
        if repository_root is not None
        else get_repository_root()
    )

    resolved_dataset_path = (
        dataset_path.resolve()
        if dataset_path is not None
        else get_default_dataset_path(
            resolved_repository_root
        )
    )

    if not resolved_dataset_path.is_file():
        raise GoldenDatasetError(
            f"Golden dataset was not found: "
            f"{resolved_dataset_path}"
        )

    try:
        raw_dataset = json.loads(
            resolved_dataset_path.read_text(
                encoding="utf-8"
            )
        )
    except json.JSONDecodeError as error:
        raise GoldenDatasetError(
            f"Golden dataset contains invalid JSON: "
            f"{error}"
        ) from error

    if not isinstance(raw_dataset, dict):
        raise GoldenDatasetError(
            "Golden dataset root must be an object."
        )

    raw_source_scope = raw_dataset.get(
        "source_scope"
    )

    if not isinstance(raw_source_scope, list):
        raise GoldenDatasetError(
            "source_scope must be an array."
        )

    source_ids: list[str] = []

    for index, raw_source in enumerate(
        raw_source_scope
    ):
        if not isinstance(raw_source, dict):
            raise GoldenDatasetError(
                f"source_scope[{index}] must be an object."
            )

        source_ids.append(
            _require_string(
                raw_source.get("source_id"),
                (
                    f"source_scope[{index}]"
                    f".source_id"
                ),
            )
        )

    if not source_ids:
        raise GoldenDatasetError(
            "source_scope cannot be empty."
        )

    if len(source_ids) != len(set(source_ids)):
        raise GoldenDatasetError(
            "source_scope contains duplicate source IDs."
        )

    raw_cases = raw_dataset.get("cases")

    if not isinstance(raw_cases, list):
        raise GoldenDatasetError(
            "cases must be an array."
        )

    if not raw_cases:
        raise GoldenDatasetError(
            "Golden dataset must contain at least one case."
        )

    approved_source_ids = set(source_ids)

    cases = tuple(
        _build_case(
            raw_case,
            index,
            approved_source_ids,
        )
        for index, raw_case in enumerate(
            raw_cases
        )
    )

    case_ids = [
        case.case_id
        for case in cases
    ]

    if len(case_ids) != len(set(case_ids)):
        raise GoldenDatasetError(
            "Golden dataset contains duplicate case IDs."
        )

    return GoldenDataset(
        dataset_id=_require_string(
            raw_dataset.get("dataset_id"),
            "dataset_id",
        ),
        dataset_version=_require_string(
            raw_dataset.get("dataset_version"),
            "dataset_version",
        ),
        title=_require_string(
            raw_dataset.get("title"),
            "title",
        ),
        description=_require_string(
            raw_dataset.get("description"),
            "description",
        ),
        status=_require_string(
            raw_dataset.get("status"),
            "status",
        ),
        source_ids=tuple(source_ids),
        evaluation_dimensions=(
            _require_string_array(
                raw_dataset.get(
                    "evaluation_dimensions"
                ),
                "evaluation_dimensions",
                allow_empty=False,
            )
        ),
        cases=cases,
    )