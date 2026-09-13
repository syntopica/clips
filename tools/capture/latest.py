"""Latest: extracted from classifications.py."""

import json
import sys
from pathlib import Path
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from tools.capture.all_runs import all_runs
else:
    from all_runs import all_runs


def latest(repo: Path, bucket: str | None) -> None:
    """One verdict per capture, the newest run winning."""
    current: dict[str, dict[str, Any]] = {}
    for path in all_runs(repo):
        for line in path.read_text().splitlines():
            if not line.strip():
                continue
            row = json.loads(line)
            key = row.get("normalized_url") or row.get("capture_id") or ""
            current[key] = row
    shown = 0
    for row in current.values():
        if bucket and row.get("bucket") != bucket:
            continue
        shown += 1
        print(f"{row.get('bucket'):12} {row.get('topic'):16} {row.get('normalized_url')}")
    print(f"\n{shown} of {len(current)} verdicts", file=sys.stderr)
