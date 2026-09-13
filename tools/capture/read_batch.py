"""Assemble a batch of captured articles for a full-text reading pass.

The point of capturing before classifying is that a verdict can be revisited
with the article in hand. This builds the input for that: N captures, full
extracted text, into one file a model can read in a single call.

Selection is by the latest classification verdict, so a pass can target exactly
the bucket being re-examined - "what did we reject?" is a different question
from "what did we defer?".

Usage:
    read_batch.py <bucket> <offset> <count> <output-file>

    bucket   ingest | review | rejected | unknown
    offset   how many to skip, so successive batches do not overlap
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

import json
import sqlite3
from typing import TYPE_CHECKING

__all__ = [
    "Path",
    "default_capture_archive",
    "json",
    "latest_verdicts",
    "main",
    "select",
    "sqlite3",
    "sys",
]


if TYPE_CHECKING:
    from tools.capture.default_capture_archive import default_capture_archive
    from tools.capture.latest_verdicts import latest_verdicts
    from tools.capture.select_batch import select_batch as select
else:
    from default_capture_archive import default_capture_archive
    from latest_verdicts import latest_verdicts
    from select_batch import select_batch as select

MAX_ARTICLE_CHARS = 24000
# bucket, offset, count and output file - the four operands in the usage line.
OPERAND_COUNT = 4


def main() -> int:
    """Write the selected articles, each truncated, into one file for a reading pass."""
    if len(sys.argv[1:]) != OPERAND_COUNT:
        print(__doc__)
        return 2
    bucket, offset, count, output = (
        sys.argv[1],
        int(sys.argv[2]),
        int(sys.argv[3]),
        Path(sys.argv[4]),
    )
    repo = default_capture_archive()
    chosen = select(repo, bucket, offset, count)
    parts = []
    for url, clip_dir in chosen:
        body_path = repo / clip_dir / "index.md"
        if not body_path.exists():
            continue
        text = body_path.read_text(errors="ignore")
        # Truncation is per-article rather than per-batch so a long piece cannot
        # crowd out the ones after it; the opening is where a technical article
        # states what it did.
        if len(text) > MAX_ARTICLE_CHARS:
            text = text[:MAX_ARTICLE_CHARS] + "\n\n[truncated]"
        parts.append(f"===== ARTICLE {url}\n{text}")
    output.write_text("\n\n".join(parts))
    print(f"{len(parts)} articles, {output.stat().st_size / 1e6:.1f} MB -> {output}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
