"""Tests for the controlled AI knowledge-source manifest."""

import json
from pathlib import Path

import pytest

from app.ai.ingestion.manifest import (
    APPROVED_CLASSIFICATION,
    APPROVED_STATUS,
    ManifestValidationError,
    load_knowledge_manifest,
)


def test_default_manifest_loads_three_approved_sources():
    manifest = load_knowledge_manifest()

    assert manifest.project == "NEXORA"
    assert (
        manifest.knowledge_base_id
        == "nexora-phase-1-procurement-qe"
    )
    assert len(manifest.sources) == 3

    source_ids = {
        source.source_id
        for source in manifest.sources
    }

    assert source_ids == {
        "NEXORA-QE-TEST-PLAN-001",
        "NEXORA-QE-CONTROL-WORKBOOK-001",
        "NEXORA-QE-README-001",
    }

    for source in manifest.sources:
        assert source.path.is_file()
        assert (
            source.classification
            == APPROVED_CLASSIFICATION
        )
        assert (
            source.approval_status
            == APPROVED_STATUS
        )


def _write_manifest(
    path: Path,
    sources: list[dict],
) -> None:
    manifest = {
        "manifest_version": "1.0",
        "project": "NEXORA",
        "knowledge_base_id": "test-knowledge-base",
        "owner": "NEXORA Quality Engineering",
        "sources": sources,
    }

    path.write_text(
        json.dumps(manifest),
        encoding="utf-8",
    )


def _approved_source(
    *,
    source_id: str,
    path: str,
    source_format: str,
    enabled: bool = True,
) -> dict:
    return {
        "source_id": source_id,
        "title": "Test Source",
        "path": path,
        "format": source_format,
        "document_type": "test_document",
        "phase": "test",
        "domain": "quality-engineering",
        "classification": APPROVED_CLASSIFICATION,
        "approval_status": APPROVED_STATUS,
        "enabled": enabled,
        "tags": ["test"],
    }


def test_duplicate_source_ids_are_rejected(
    tmp_path: Path,
):
    manifest_path = tmp_path / "manifest.json"

    _write_manifest(
        manifest_path,
        [
            _approved_source(
                source_id="DUPLICATE-001",
                path="first.md",
                source_format="markdown",
                enabled=False,
            ),
            _approved_source(
                source_id="DUPLICATE-001",
                path="second.md",
                source_format="markdown",
                enabled=False,
            ),
        ],
    )

    with pytest.raises(
        ManifestValidationError,
        match="Duplicate source_id",
    ):
        load_knowledge_manifest(
            manifest_path=manifest_path,
            repository_root=tmp_path,
        )


def test_path_traversal_is_rejected(
    tmp_path: Path,
):
    manifest_path = tmp_path / "manifest.json"

    _write_manifest(
        manifest_path,
        [
            _approved_source(
                source_id="UNSAFE-001",
                path="../outside.md",
                source_format="markdown",
            )
        ],
    )

    with pytest.raises(
        ManifestValidationError,
        match="escapes the repository",
    ):
        load_knowledge_manifest(
            manifest_path=manifest_path,
            repository_root=tmp_path,
        )


def test_unsupported_source_format_is_rejected(
    tmp_path: Path,
):
    unsafe_file = tmp_path / "source.exe"
    unsafe_file.write_text(
        "This must not be ingested.",
        encoding="utf-8",
    )

    manifest_path = tmp_path / "manifest.json"

    _write_manifest(
        manifest_path,
        [
            _approved_source(
                source_id="UNSUPPORTED-001",
                path="source.exe",
                source_format="executable",
            )
        ],
    )

    with pytest.raises(
        ManifestValidationError,
        match="Unsupported source format",
    ):
        load_knowledge_manifest(
            manifest_path=manifest_path,
            repository_root=tmp_path,
        )