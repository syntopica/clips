"""Already screened: extracted from screen_pending.py."""

import json
from pathlib import Path


def already_screened(repo: Path) -> set[str]:
    """Clip ids any previous screening run has already answered for.

    Only this tool's own runs count. A verdict from the title-based triage says
    nothing about whether the text is worth a synthesis, which is the question
    here, and re-answering it is the point of a second run.
    """
    seen: set[str] = set()
    for path in repo.glob("classifications/*/screen-*.jsonl"):
        for line in path.read_text(errors="ignore").splitlines():
            if not line.strip():
                continue
            row = json.loads(line)
            if row.get("capture_id"):
                seen.add(row["capture_id"])
    return seen
