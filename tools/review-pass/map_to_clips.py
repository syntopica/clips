"""Say, for every extracted Review entry, whether it is already known.

Usage: map_to_clips.py <review.jsonl> <out.jsonl> [brain] [capture-archive]

Two independent questions, and they answer to different sources:

- **Is it already in the wiki?** Every Medium url cited by a page, taken from
  the page directories only. The triage records under `sources/` are excluded on
  purpose: they list the whole harvest, so including them would mark all 834 as
  known.
- **Is it already captured?** the capture archive's `url-index.sqlite3`, which
  is the capture ledger.

Both comparisons are on the Medium post id, never the whole url, because one
post reaches the store under several url spellings - the same rule
`articleDedupKey` applies inside the clips CLI.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

import sqlite3
import subprocess
from typing import NotRequired, TypedDict

from tools.bootstrap.engine_archive import engine_archive
from tools.bootstrap.engine_config import engine_config

__all__ = [
    "NotRequired",
    "Path",
    "ReviewRow",
    "TypedDict",
    "annotate",
    "captured",
    "json",
    "main",
    "re",
    "sqlite3",
    "subprocess",
    "sys",
    "wiki_post_ids",
]

import json
import re

BRAIN_ARG = 3
CLIPS_ARG = 4
POST_ID = re.compile(r"([0-9a-f]{8,14})$")
PAGE_DIRECTORIES = ("topics", "business", "projects", "people", "personal")
MEDIUM_URL = r"https://[a-z0-9.-]*medium\.com/[^ )>\"]+"


from annotate import annotate
from captured import captured
from review_row import ReviewRow
from wiki_post_ids import wiki_post_ids


def main(argv: list[str]) -> int:
    """Annotate every extracted entry and report how the three buckets split."""
    if len(argv) > CLIPS_ARG:
        brain, clips = Path(argv[BRAIN_ARG]), Path(argv[CLIPS_ARG])
    else:
        config = engine_config()
        brain = Path(argv[BRAIN_ARG]) if len(argv) > BRAIN_ARG else config.index.parent
        clips = engine_archive(config)

    rows: list[ReviewRow] = [
        json.loads(line) for line in Path(argv[1]).read_text().splitlines() if line
    ]
    annotate(rows, wiki_post_ids(brain), captured(clips))

    Path(argv[2]).write_text("\n".join(json.dumps(row, ensure_ascii=False) for row in rows) + "\n")
    in_wiki = sum(1 for row in rows if row["in_wiki"])
    uncaptured = sum(1 for row in rows if row["bucket"] == "uncaptured")
    print(
        f"mapped {len(rows)}: {in_wiki} already in the wiki, "
        f"{uncaptured} never captured, {len(rows) - in_wiki - uncaptured} to judge"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
