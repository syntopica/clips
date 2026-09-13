"""Chatgpt tools: write index."""

import json
from pathlib import Path
from typing import Any


def write_index(directory: Path, *records: dict[str, Any]) -> Path:
    """Write an index.jsonl and return its path."""
    directory.mkdir(parents=True, exist_ok=True)
    path = directory / "index.jsonl"
    path.write_text("".join(json.dumps(r) + "\n" for r in records), encoding="utf-8")
    return path
