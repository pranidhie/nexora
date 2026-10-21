"""Load and validate the approved AI knowledge-source manifest."""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any


APPROVED_STATUS = "approved_for_initial_prototype"
APPROVED_CLASSIFICATION = "PUBLIC_SANITISED"

FORMAT_SUFFIXES = {
    "pdf": ".pdf",
    "xlsx": ".xlsx",
    "markdown": ".md",
}

BLOCKED_PATH_PARTS = {
    ".env",
    ".git",
    ".auth",
    "node_modules",
    "venv",
    "__pycache__",
    "playwright-report",
    "test-results",
}


class ManifestValidationError(ValueError):
    """Raised when the knowledge-source manifest is unsafe or invalid."""


@dataclass(frozen=True)
class SourceDocument:
    """A validated document approved for knowledge ingestion."""

    source_id: str
    title: str
    path: Path
    relative_path: str
    format: str
    document_type: str
    phase: str
    domain: str
    classification: str
    approval_status: str
    tags: tuple[str, ...]


@dataclass(frozen=True)
class KnowledgeManifest:
    """Validated configuration for a controlled knowledge base."""

    manifest_version: str
    project: str
    knowledge_base_id: str
    owner: str
    sources: tuple[SourceDocument, ...]


def get_repository_root() -> Path:
    """Return the NEXORA repository root."""

    return Path(__file__).resolve().parents[4]


def get_default_manifest_path(
    repository_root: Path,
) -> Path:
    """Return the default knowledge-source manifest path."""

    return (
        repository_root
        / "docs"
        / "ai-quality"
        / "knowledge-sources.json"
    )


def _require_non_empty_string(
    value: Any,
    field_name: str,
) -> str:
    """Validate and normalise a required string field."""

    if not isinstance(value, str) or not value.strip():
        raise ManifestValidationError(
            f"{field_name} must be a non-empty string."
        )

    return value.strip()


def _validate_source_path(
    repository_root: Path,
    relative_path: str,
    source_format: str,
) -> Path:
    """Resolve and validate an approved source path."""

    candidate = (
        repository_root
        / Path(relative_path)
    ).resolve()

    try:
        candidate.relative_to(repository_root)
    except ValueError as error:
        raise ManifestValidationError(
            f"Source path escapes the repository: "
            f"{relative_path}"
        ) from error

    lowered_parts = {
        part.lower()
        for part in Path(relative_path).parts
    }

    blocked_parts = (
        lowered_parts
        & BLOCKED_PATH_PARTS
    )

    if blocked_parts:
        blocked_value = sorted(blocked_parts)[0]

        raise ManifestValidationError(
            f"Source path contains a blocked component: "
            f"{blocked_value}"
        )

    expected_suffix = FORMAT_SUFFIXES.get(
        source_format
    )

    if expected_suffix is None:
        raise ManifestValidationError(
            f"Unsupported source format: "
            f"{source_format}"
        )

    if candidate.suffix.lower() != expected_suffix:
        raise ManifestValidationError(
            f"Source format '{source_format}' does not "
            f"match file extension for {relative_path}."
        )

    if not candidate.is_file():
        raise ManifestValidationError(
            f"Approved source file does not exist: "
            f"{relative_path}"
        )

    return candidate


def _validate_unique_source_ids(
    raw_sources: list[Any],
) -> None:
    """Ensure every manifest source has a unique identifier."""

    seen_source_ids: set[str] = set()

    for index, raw_source in enumerate(raw_sources):
        if not isinstance(raw_source, dict):
            raise ManifestValidationError(
                f"sources[{index}] must be an object."
            )

        source_id = _require_non_empty_string(
            raw_source.get("source_id"),
            f"sources[{index}].source_id",
        )

        if source_id in seen_source_ids:
            raise ManifestValidationError(
                f"Duplicate source_id: {source_id}"
            )

        seen_source_ids.add(source_id)


def _build_source_document(
    raw_source: dict[str, Any],
    repository_root: Path,
) -> SourceDocument:
    """Build one validated source-document configuration."""

    source_id = _require_non_empty_string(
        raw_source.get("source_id"),
        "source_id",
    )

    title = _require_non_empty_string(
        raw_source.get("title"),
        f"{source_id}.title",
    )

    relative_path = _require_non_empty_string(
        raw_source.get("path"),
        f"{source_id}.path",
    )

    source_format = _require_non_empty_string(
        raw_source.get("format"),
        f"{source_id}.format",
    ).lower()

    document_type = _require_non_empty_string(
        raw_source.get("document_type"),
        f"{source_id}.document_type",
    )

    phase = _require_non_empty_string(
        raw_source.get("phase"),
        f"{source_id}.phase",
    )

    domain = _require_non_empty_string(
        raw_source.get("domain"),
        f"{source_id}.domain",
    )

    classification = _require_non_empty_string(
        raw_source.get("classification"),
        f"{source_id}.classification",
    )

    approval_status = _require_non_empty_string(
        raw_source.get("approval_status"),
        f"{source_id}.approval_status",
    )

    if classification != APPROVED_CLASSIFICATION:
        raise ManifestValidationError(
            f"{source_id} has an unapproved "
            f"classification: {classification}"
        )

    if approval_status != APPROVED_STATUS:
        raise ManifestValidationError(
            f"{source_id} is not approved for ingestion."
        )

    raw_tags = raw_source.get("tags", [])

    if not isinstance(raw_tags, list):
        raise ManifestValidationError(
            f"{source_id}.tags must be an array."
        )

    tags = tuple(
        _require_non_empty_string(
            tag,
            f"{source_id}.tags",
        )
        for tag in raw_tags
    )

    validated_path = _validate_source_path(
        repository_root,
        relative_path,
        source_format,
    )

    return SourceDocument(
        source_id=source_id,
        title=title,
        path=validated_path,
        relative_path=relative_path,
        format=source_format,
        document_type=document_type,
        phase=phase,
        domain=domain,
        classification=classification,
        approval_status=approval_status,
        tags=tags,
    )


def load_knowledge_manifest(
    manifest_path: Path | None = None,
    repository_root: Path | None = None,
) -> KnowledgeManifest:
    """Load and validate enabled, approved knowledge sources."""

    resolved_repository_root = (
        repository_root.resolve()
        if repository_root is not None
        else get_repository_root()
    )

    resolved_manifest_path = (
        manifest_path.resolve()
        if manifest_path is not None
        else get_default_manifest_path(
            resolved_repository_root
        )
    )

    if not resolved_manifest_path.is_file():
        raise ManifestValidationError(
            f"Knowledge manifest was not found: "
            f"{resolved_manifest_path}"
        )

    try:
        raw_manifest = json.loads(
            resolved_manifest_path.read_text(
                encoding="utf-8"
            )
        )
    except json.JSONDecodeError as error:
        raise ManifestValidationError(
            f"Knowledge manifest contains invalid JSON: "
            f"{error}"
        ) from error

    if not isinstance(raw_manifest, dict):
        raise ManifestValidationError(
            "Knowledge manifest root must be an object."
        )

    raw_sources = raw_manifest.get("sources")

    if not isinstance(raw_sources, list):
        raise ManifestValidationError(
            "Knowledge manifest sources must be an array."
        )

    _validate_unique_source_ids(raw_sources)

    enabled_sources = [
        source
        for source in raw_sources
        if source.get("enabled") is True
    ]

    if not enabled_sources:
        raise ManifestValidationError(
            "Knowledge manifest has no enabled sources."
        )

    validated_sources = tuple(
        _build_source_document(
            source,
            resolved_repository_root,
        )
        for source in enabled_sources
    )

    return KnowledgeManifest(
        manifest_version=_require_non_empty_string(
            raw_manifest.get("manifest_version"),
            "manifest_version",
        ),
        project=_require_non_empty_string(
            raw_manifest.get("project"),
            "project",
        ),
        knowledge_base_id=_require_non_empty_string(
            raw_manifest.get("knowledge_base_id"),
            "knowledge_base_id",
        ),
        owner=_require_non_empty_string(
            raw_manifest.get("owner"),
            "owner",
        ),
        sources=validated_sources,
    )