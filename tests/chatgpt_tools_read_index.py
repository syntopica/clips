"""Chatgpt tools: read index."""

import json
from pathlib import Path
from typing import Any


def read_index(path: Path) -> list[dict[str, Any]]:
    """Parse an index.jsonl back into records."""
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line]
