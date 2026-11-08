"""Build the approved NEXORA AI knowledge base."""

from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache

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


class KnowledgeBaseError(RuntimeError):
    """Raised when the knowledge base cannot be constructed."""


@dataclass(frozen=True)
class KnowledgeBase:
    """Runtime components of the approved knowledge base."""

    retriever: LexicalRetriever
    allowed_source_ids: tuple[str, ...]
    document_count: int
    chunk_count: int


def build_knowledge_base() -> KnowledgeBase:
    """Build a retriever from approved manifest documents."""

    manifest = load_knowledge_manifest()

    documents = tuple(
        extract_manifest_documents(manifest)
    )

    if not documents:
        raise KnowledgeBaseError(
            "The approved knowledge manifest produced "
            "no documents."
        )

    chunks = tuple(
        chunk_documents(documents)
    )

    if not chunks:
        raise KnowledgeBaseError(
            "The approved documents produced no "
            "knowledge chunks."
        )

    allowed_source_ids = tuple(
        dict.fromkeys(
            document.source_id
            for document in documents
        )
    )

    retriever = LexicalRetriever(chunks)

    return KnowledgeBase(
        retriever=retriever,
        allowed_source_ids=allowed_source_ids,
        document_count=len(documents),
        chunk_count=len(chunks),
    )


@lru_cache(maxsize=1)
def get_knowledge_base() -> KnowledgeBase:
    """Return the cached application knowledge base."""

    return build_knowledge_base()