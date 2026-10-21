"""Create deterministic, traceable knowledge chunks."""

from __future__ import annotations

import hashlib
from dataclasses import dataclass

from app.ai.ingestion.models import (
    ExtractedDocument,
    ExtractedSection,
    KnowledgeChunk,
)


DEFAULT_MAX_CHARS = 1_200
DEFAULT_OVERLAP_CHARS = 150
MINIMUM_CHUNK_SIZE = 50


class ChunkingError(ValueError):
    """Raised when extracted content cannot be safely chunked."""


@dataclass(frozen=True)
class ChunkingConfig:
    """Configuration controlling deterministic chunk creation."""

    max_chars: int = DEFAULT_MAX_CHARS
    overlap_chars: int = DEFAULT_OVERLAP_CHARS

    def __post_init__(self) -> None:
        if self.max_chars < MINIMUM_CHUNK_SIZE:
            raise ChunkingError(
                f"max_chars must be at least "
                f"{MINIMUM_CHUNK_SIZE}."
            )

        if self.overlap_chars < 0:
            raise ChunkingError(
                "overlap_chars cannot be negative."
            )

        if self.overlap_chars >= self.max_chars:
            raise ChunkingError(
                "overlap_chars must be smaller "
                "than max_chars."
            )

        if self.overlap_chars > self.max_chars // 2:
            raise ChunkingError(
                "overlap_chars cannot exceed half "
                "of max_chars."
            )


def _content_sha256(
    text: str,
) -> str:
    """Create a deterministic fingerprint for chunk content."""

    return hashlib.sha256(
        text.encode("utf-8")
    ).hexdigest()


def _choose_chunk_end(
    text: str,
    start: int,
    maximum_end: int,
) -> int:
    """Prefer natural paragraph, line or word boundaries."""

    if maximum_end >= len(text):
        return len(text)

    minimum_preferred_end = (
        start
        + (maximum_end - start) // 2
    )

    paragraph_boundary = text.rfind(
        "\n\n",
        minimum_preferred_end,
        maximum_end,
    )

    if paragraph_boundary > start:
        return paragraph_boundary

    line_boundary = text.rfind(
        "\n",
        minimum_preferred_end,
        maximum_end,
    )

    if line_boundary > start:
        return line_boundary

    word_boundary = text.rfind(
        " ",
        minimum_preferred_end,
        maximum_end,
    )

    if word_boundary > start:
        return word_boundary

    return maximum_end


def _choose_next_start(
    text: str,
    current_start: int,
    current_end: int,
    overlap_chars: int,
) -> int:
    """Calculate the next position while retaining safe overlap."""

    if overlap_chars == 0:
        return current_end

    overlap_start = max(
        current_start + 1,
        current_end - overlap_chars,
    )

    space_boundary = text.rfind(
        " ",
        current_start + 1,
        overlap_start + 1,
    )

    line_boundary = text.rfind(
        "\n",
        current_start + 1,
        overlap_start + 1,
    )

    natural_boundary = max(
        space_boundary,
        line_boundary,
    )

    if natural_boundary > current_start:
        next_start = natural_boundary + 1
    else:
        next_start = overlap_start

    while (
        next_start < current_end
        and text[next_start].isspace()
    ):
        next_start += 1

    if next_start <= current_start:
        return current_end

    return next_start


def _split_section_text(
    section: ExtractedSection,
    config: ChunkingConfig,
) -> tuple[str, ...]:
    """Split section text into bounded, overlapping chunks."""

    text = section.text.strip()

    if not text:
        return ()

    chunks: list[str] = []
    start = 0

    while start < len(text):
        maximum_end = min(
            start + config.max_chars,
            len(text),
        )

        end = _choose_chunk_end(
            text,
            start,
            maximum_end,
        )

        chunk_text = text[start:end].strip()

        if chunk_text:
            chunks.append(chunk_text)

        if end >= len(text):
            break

        start = _choose_next_start(
            text,
            start,
            end,
            config.overlap_chars,
        )

    return tuple(chunks)


def chunk_document(
    document: ExtractedDocument,
    config: ChunkingConfig | None = None,
) -> tuple[KnowledgeChunk, ...]:
    """Convert one extracted document into retrieval-ready chunks."""

    resolved_config = config or ChunkingConfig()

    knowledge_chunks: list[KnowledgeChunk] = []

    for section in document.sections:
        section_chunks = _split_section_text(
            section,
            resolved_config,
        )

        for chunk_index, chunk_text in enumerate(
            section_chunks,
            start=1,
        ):
            knowledge_chunks.append(
                KnowledgeChunk(
                    chunk_id=(
                        f"{section.section_id}:"
                        f"chunk:{chunk_index:04d}"
                    ),
                    source_id=document.source_id,
                    document_title=document.title,
                    relative_path=document.relative_path,
                    format=document.format,
                    document_type=document.document_type,
                    phase=document.phase,
                    domain=document.domain,
                    classification=document.classification,
                    tags=document.tags,
                    file_sha256=document.file_sha256,
                    section_id=section.section_id,
                    section_title=section.title,
                    locator=section.locator,
                    chunk_index=chunk_index,
                    text=chunk_text,
                    content_sha256=_content_sha256(
                        chunk_text
                    ),
                )
            )

    if not knowledge_chunks:
        raise ChunkingError(
            f"No chunks were created for source "
            f"{document.source_id}."
        )

    return tuple(knowledge_chunks)


def chunk_documents(
    documents: tuple[ExtractedDocument, ...],
    config: ChunkingConfig | None = None,
) -> tuple[KnowledgeChunk, ...]:
    """Chunk multiple extracted documents."""

    resolved_config = config or ChunkingConfig()

    all_chunks: list[KnowledgeChunk] = []

    for document in documents:
        all_chunks.extend(
            chunk_document(
                document,
                resolved_config,
            )
        )

    return tuple(all_chunks)