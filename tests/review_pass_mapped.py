"""Review pass: mapped."""

import json
from pathlib import Path


def _mapped(tmp_path: Path, rows: list[dict]) -> Path:
    path = tmp_path / "review-mapped.jsonl"
    path.write_text("".join(json.dumps(row) + "\n" for row in rows))
    return path
