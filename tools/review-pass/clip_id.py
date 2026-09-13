"""Clip id: extracted from write_audit.py."""

import re
from pathlib import Path

from mapped_row import MappedRow

CLIP_ID = re.compile(r'^clip_id:\s*"([^"]+)"', re.MULTILINE)


def clip_id(row: MappedRow, clips_root: Path) -> str:
    """Return the clip's own id, or "unknown" when the clip is not on disk."""
    index = clips_root / row["clip_dir"] / "index.md"
    match = CLIP_ID.search(index.read_text()) if index.exists() else None
    return match.group(1) if match else "unknown"
