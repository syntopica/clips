"""Iter jsonl: extracted from convert.py."""

import json
from collections.abc import Iterator
from pathlib import Path
from typing import Any


def iter_jsonl(path: Path) -> Iterator[dict[str, Any]]:
    """Yield one decoded JSON value per non-blank line, dropping undecodable ones.

    Every store here writes one JSON *object* per line, which is what the
    annotation states; a line holding a bare array or scalar is yielded
    unchanged and blows up in the caller's `.get`.
    """
    with path.open(encoding="utf-8", errors="replace") as handle:
        for raw in handle:
            line = raw.strip()
            if not line:
                continue
            try:
                yield json.loads(line)
            except json.JSONDecodeError:
                continue
