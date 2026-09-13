#!/usr/bin/env python3
"""Turn the parts `collect.js` downloaded into one markdown file per conversation.

The split is deliberate. Fetching has to happen inside the browser - chatgpt.com
is behind Cloudflare bot protection and answers 403 to curl and urllib even with
the session's own bearer token - but rendering is pure data work and belongs in
a file that can be re-run over the same input without touching the account.

Input:  ~/Downloads/chatgpt-part-*.json  (and chatgpt-index.json)
Output: sources/chatgpt/<date>-<slug>-<id8>.md
        sources/chatgpt/raw/<same>.json   - the untouched tree, gitignored

Usage:  python3 tools/chatgpt/convert.py [input-directory]
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

import re
from datetime import UTC, datetime
from typing import TYPE_CHECKING

__all__ = [
    "UTC",
    "Any",
    "Path",
    "datetime",
    "is_shown",
    "json",
    "linear_messages",
    "main",
    "message_text",
    "part_text",
    "re",
    "render",
    "slug",
    "stamp",
    "sys",
]

import json
from typing import Any

if TYPE_CHECKING:
    from tools.chatgpt.chatgpt_convert_message_text import (
        chatgpt_convert_message_text as message_text,
    )
    from tools.chatgpt.chatgpt_convert_render import chatgpt_convert_render as render
    from tools.chatgpt.chatgpt_convert_slug import chatgpt_convert_slug as slug
    from tools.chatgpt.is_shown import is_shown
    from tools.chatgpt.linear_messages import linear_messages
    from tools.chatgpt.part_text import part_text
    from tools.chatgpt.stamp import stamp
else:
    from chatgpt_convert_message_text import chatgpt_convert_message_text as message_text
    from chatgpt_convert_render import chatgpt_convert_render as render
    from chatgpt_convert_slug import chatgpt_convert_slug as slug
    from is_shown import is_shown
    from linear_messages import linear_messages
    from part_text import part_text
    from stamp import stamp

OUT = Path(__file__).resolve().parents[2] / "sources" / "chatgpt"

# The shape of an exported conversation is ChatGPT's, not ours, and it has
# changed under us before: every node, message and content part is read
# defensively, so the values stay `Any` and each read is guarded where it
# happens rather than promised here.
JsonDict = dict[str, Any]


def main() -> int:
    """Render every unconsumed part file, then move the parts aside."""
    source = Path(sys.argv[1]) if len(sys.argv) > 1 else Path.home() / "Downloads"
    # Both shapes: `chatgpt-<run>-part-NNN.json` from any current run, and the
    # older `chatgpt-part-NNN.json` - including the `... (1).json` Chrome writes
    # when two runs pick the same name, which is exactly the case a narrower
    # glob used to drop on the floor.
    parts = sorted(
        set(source.glob("chatgpt-*part-*.json")) - set(source.glob("chatgpt-index*.json"))
    )
    if not parts:
        # Not an error. Under `keeper.sh` this is the ordinary state between
        # bursts, and reporting it as a failure every five minutes for a
        # weekend buries the entries that mean something.
        print(f"nothing new in {source}")
        return 0

    OUT.mkdir(parents=True, exist_ok=True)
    raw_dir = OUT / "raw"
    raw_dir.mkdir(exist_ok=True)

    written = 0
    empty = 0
    failed: list[str] = []
    seen: set[str] = set()
    for part in parts:
        payload = json.loads(part.read_text(encoding="utf-8"))
        for record in payload.get("exported") or []:
            summary = record.get("summary") or {}
            tree = record.get("tree")
            identifier = summary.get("id") or ""
            if not identifier or identifier in seen:
                continue
            seen.add(identifier)
            if tree is None:
                failed.append(f"{identifier}: {record.get('error', 'no tree')}")
                continue
            created = stamp(tree.get("create_time") or summary.get("create_time"))
            date = created[:10] if created else "undated"
            name = f"{date}-{slug(tree.get('title') or summary.get('title'))}-{identifier[:8]}"
            body = render(summary, tree)
            if body.count("\n## ") == 0:
                empty += 1
            (raw_dir / f"{name}.json").write_text(
                json.dumps(tree, ensure_ascii=False), encoding="utf-8"
            )
            (OUT / f"{name}.md").write_text(body, encoding="utf-8")
            written += 1

    # Consumed parts move aside. Re-reading every part on every tick is fine for
    # an afternoon and not for a weekend: an unattended run accumulates
    # hundreds, and a converter that re-parses all of them every five minutes
    # degrades quietly the longer it works. Moved rather than deleted - they
    # are the raw download, and the account they came from is about to be
    # emptied.
    consumed = source / "chatgpt-consumed"
    consumed.mkdir(exist_ok=True)
    for part in parts:
        part.replace(consumed / part.name)

    print(f"{len(parts)} parts -> {written} conversations in {OUT}")
    print(f"{empty} rendered with no visible message")
    if failed:
        print(f"{len(failed)} could not be fetched:", file=sys.stderr)
        for line in failed[:20]:
            print(f"  {line}", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
