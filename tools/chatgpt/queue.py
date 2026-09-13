#!/usr/bin/env python3
"""Print the conversations still to fetch, as JSON slices `run.sh` can inject.

The queue is the saved index minus everything already rendered to markdown, so
resume state is the export itself rather than a side file that can disagree
with it. Slices because chrome-cli hands its script to Chrome as an AppleEvent
string, and one 2000-entry literal is larger than that wants to carry.

Usage:  queue.py <index.json> <sources/chatgpt> [slice-size]
"""

import json
import re
import sys
from pathlib import Path

CONVERSATION_ID = re.compile(r"^conversation_id: (\S+)$", re.M)

DEFAULT_SLICE = 200
# argv: script, index.json, output-dir, [slice]
REQUIRED_ARGS = 3
SLICE_ARG = 3


def main() -> int:
    """Print the ids still to fetch, one JSON slice per line."""
    if len(sys.argv) < REQUIRED_ARGS:
        print("usage: queue.py <index.json> <output-dir> [slice]", file=sys.stderr)
        return 1
    index = Path(sys.argv[1])
    out = Path(sys.argv[2])
    size = int(sys.argv[SLICE_ARG]) if len(sys.argv) > SLICE_ARG else DEFAULT_SLICE

    done: set[str] = set()
    for page in out.glob("*.md"):
        found = CONVERSATION_ID.search(page.read_text(encoding="utf-8"))
        if found:
            done.add(found.group(1))

    summaries = json.loads(index.read_text(encoding="utf-8"))["summaries"]
    todo = [
        {"id": summary["id"], "archived": bool(summary.get("archived"))}
        for summary in summaries
        if summary.get("id") and summary["id"] not in done
    ]
    print(f"{len(todo)} to fetch, {len(done)} already exported", file=sys.stderr)
    for start in range(0, len(todo), size):
        print(json.dumps(todo[start : start + size], separators=(",", ":")))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
