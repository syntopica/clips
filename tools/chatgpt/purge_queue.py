#!/usr/bin/env python3
"""Print the conversation ids safe to delete, as JSON slices `purge.sh` injects.

Safe means backed up twice over: the id is taken from a rendered `.md` and only
survives if the matching `raw/<slug>.json` is also on disk and parses. The
deleter has no lister of its own, so this file is the entire definition of what
the purge can reach - anything the account holds that the export does not is
unreachable by construction rather than by a check that could be skipped.

One conversation in this corpus carries NUL bytes inside its own content (an
invoice number the model echoed back), which makes `grep` treat the markdown as
binary and skip it. Python decodes it fine; a shell pipeline over the same files
silently returns one id short, which is how it was found.

Slices because chrome-cli hands its script to Chrome as an AppleEvent string,
and one 2000-entry literal is larger than that wants to carry.

Usage:  purge_queue.py <sources/chatgpt> [slice-size]
"""

import json
import re
import sys
from pathlib import Path

CONVERSATION_ID = re.compile(r"^conversation_id: (\S+)$", re.M)
UUID = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$")

DEFAULT_SLICE = 200
# argv: script, sources/chatgpt, [slice]
REQUIRED_ARGS = 2
SLICE_ARG = 2


def main() -> int:
    """Print the ids safe to delete, one JSON slice per line."""
    if len(sys.argv) < REQUIRED_ARGS:
        print("usage: purge_queue.py <sources/chatgpt> [slice]", file=sys.stderr)
        return 1
    out = Path(sys.argv[1])
    size = int(sys.argv[SLICE_ARG]) if len(sys.argv) > SLICE_ARG else DEFAULT_SLICE

    ids: list[str] = []
    unpaired: list[str] = []
    for page in sorted(out.glob("*.md")):
        found = CONVERSATION_ID.search(page.read_text(encoding="utf-8"))
        if not found or not UUID.match(found.group(1)):
            unpaired.append(f"{page.name}: no usable conversation_id")
            continue
        raw = out / "raw" / f"{page.stem}.json"
        if not raw.is_file() or raw.stat().st_size == 0:
            unpaired.append(f"{page.name}: no raw json")
            continue
        try:
            json.loads(raw.read_text(encoding="utf-8"))
        except ValueError as error:
            unpaired.append(f"{page.name}: raw json unreadable ({error})")
            continue
        ids.append(found.group(1))

    for line in unpaired:
        print(f"withheld {line}", file=sys.stderr)
    print(f"{len(ids)} deletable, {len(unpaired)} withheld", file=sys.stderr)
    if len(set(ids)) != len(ids):
        print("duplicate ids in the export - refusing", file=sys.stderr)
        return 1
    for start in range(0, len(ids), size):
        print(json.dumps(ids[start : start + size], separators=(",", ":")))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
