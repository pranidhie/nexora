"""Tests for controlled AI knowledge-source extraction."""

from pathlib import Path

import pytest
from openpyxl import Workbook

from app.ai.ingestion.extractors import (
    DocumentExtractionError,
    extract_manifest_documents,
    extract_source_document,
)
from app.ai.ingestion.manifest import (
    SourceDocument,
    load_knowledge_manifest,
)


def build_source(
    file_path: Path,
    *,
    source_id: str,
    source_format: str,
) -> SourceDocument:
    """Create a validated-style source for isolated tests."""

    return SourceDocument(
        source_id=source_id,
        title="Test knowledge source",
        path=file_path,
        relative_path=file_path.name,
        format=source_format,
        document_type="test_document",
        phase="phase-1",
        domain="procurement",
        classification="PUBLIC_SANITISED",
        approval_status=(
            "approved_for_initial_prototype"
        ),
        tags=("test",),
    )


def test_markdown_is_split_into_traceable_sections(
    tmp_path: Path,
) -> None:
    markdown_path = tmp_path / "knowledge.md"

    markdown_path.write_text(
        "# Scope\n"
        "Supplier and purchase-order testing.\n\n"
        "## Security\n"
        "Unauthenticated requests must be rejected.\n",
        encoding="utf-8",
    )

    source = build_source(
        markdown_path,
        source_id="TEST-MARKDOWN-001",
        source_format="markdown",
    )

    document = extract_source_document(source)

    assert document.source_id == "TEST-MARKDOWN-001"
    assert document.file_sha256
    assert len(document.sections) == 2
    assert document.sections[0].title == "Scope"
    assert (
        document.sections[0].locator
        == "markdown:line:1"
    )
    assert (
        "Unauthenticated requests"
        in document.sections[1].text
    )


def test_visible_workbook_sheet_is_extracted(
    tmp_path: Path,
) -> None:
    workbook_path = tmp_path / "knowledge.xlsx"

    workbook = Workbook()
    worksheet = workbook.active
    worksheet.title = "Requirements"

    worksheet.append(
        [
            "Requirement ID",
            "Description",
        ]
    )
    worksheet.append(
        [
            "SEC-REQ-002",
            (
                "Unauthenticated access "
                "must be rejected"
            ),
        ]
    )

    workbook.save(workbook_path)
    workbook.close()

    source = build_source(
        workbook_path,
        source_id="TEST-WORKBOOK-001",
        source_format="xlsx",
    )

    document = extract_source_document(source)

    assert len(document.sections) == 1
    assert (
        document.sections[0].locator
        == "sheet:Requirements"
    )
    assert (
        "SEC-REQ-002"
        in document.sections[0].text
    )


def test_unsupported_extraction_format_is_rejected(
    tmp_path: Path,
) -> None:
    text_path = tmp_path / "knowledge.txt"
    text_path.write_text(
        "Unapproved format",
        encoding="utf-8",
    )

    source = build_source(
        text_path,
        source_id="TEST-TEXT-001",
        source_format="txt",
    )

    with pytest.raises(
        DocumentExtractionError,
        match="Unsupported extraction format",
    ):
        extract_source_document(source)


def test_approved_manifest_sources_are_extracted() -> None:
    manifest = load_knowledge_manifest()

    documents = extract_manifest_documents(
        manifest
    )

    assert len(documents) == 3

    documents_by_format = {
        document.format: document
        for document in documents
    }

    assert set(documents_by_format) == {
        "pdf",
        "xlsx",
        "markdown",
    }

    for document in documents:
        assert document.sections
        assert document.character_count > 0
        assert document.file_sha256
        assert (
            document.classification
            == "PUBLIC_SANITISED"
        )

    pdf_document = documents_by_format["pdf"]
    workbook_document = documents_by_format["xlsx"]

    assert any(
        section.locator.startswith("page:")
        for section in pdf_document.sections
    )

    assert any(
        section.locator.startswith("sheet:")
        for section in workbook_document.sections
    )