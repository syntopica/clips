"""Drops from: extracted from record_reading.py."""

import re
from pathlib import Path
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tools.capture.url_index import normalize
else:
    from url_index import normalize

DROP_LINE = re.compile(r"^-\s+(https?://\S+)\s*[-—:]\s*(.+)$", re.MULTILINE)


def drops_from(path: Path) -> dict[str, str]:
    """URL -> why the reader passed on it, when a reasons file exists."""
    if not path.exists():
        return {}
    return {
        normalize(url): reason.strip()[:300]
        for url, reason in DROP_LINE.findall(path.read_text(errors="ignore"))
    }
