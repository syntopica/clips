"""Read metadata: extracted from url_index.py."""

import json
from pathlib import Path
from typing import Any


def read_metadata(clip_dir: Path) -> dict[str, Any]:
    """A clip's `metadata.json`, or an empty mapping when it is absent or unparseable.

    Missing and corrupt are deliberately the same answer: every caller here
    treats a clip it cannot read as a clip with no fields, and none of them
    can repair one.
    """
    path = clip_dir / "metadata.json"
    if not path.exists():
        return {}
    try:
        parsed: dict[str, Any] = json.loads(path.read_text())
    except json.JSONDecodeError:
        return {}
    return parsed
