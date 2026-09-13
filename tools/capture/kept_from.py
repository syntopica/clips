"""Kept from: extracted from record_reading.py."""

import re
from pathlib import Path
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tools.capture.url_index import normalize
else:
    from url_index import normalize


def kept_from(path: Path) -> dict[str, str]:
    """URL -> the first substantive line recorded for it."""
    text = path.read_text(errors="ignore")
    kept: dict[str, str] = {}
    sections = re.split(r"^###\s+", text, flags=re.MULTILINE)[1:]
    for section in sections:
        lines = section.strip().split("\n")
        url = lines[0].strip()
        detail = next(
            (line.strip("- ").strip() for line in lines[1:] if line.strip().startswith("-")),
            "kept, no detail recorded",
        )
        kept[normalize(url)] = detail[:400]
    return kept
