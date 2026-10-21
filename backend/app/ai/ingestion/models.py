"""Data models representing safely extracted knowledge content."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class ExtractedSection:
    """One traceable section extracted from an approved source."""

    section_id: str
    source_id: str
    title: str
    locator: str
    text: str


@dataclass(frozen=True)
class ExtractedDocument:
    """A complete approved document after extraction."""

    source_id: str
    title: str
    relative_path: str
    format: str
    document_type: str
    phase: str
    domain: str
    classification: str
    tags: tuple[str, ...]
    file_sha256: str
    sections: tuple[ExtractedSection, ...]

    @property
    def character_count(self) -> int:
        """Return the total number of extracted characters."""

        return sum(
            len(section.text)
            for section in self.sections
        )