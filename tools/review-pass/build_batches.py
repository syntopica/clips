"""Build the batches the second pass reads: clip text, not titles.

Usage: build_batches.py <review-mapped.jsonl> <work-directory> [capture-archive]

The candidates are the entries that are captured but not yet cited by a page -
the ones nobody has decided about. Each contributes the opening of its clip's
own `index.md`, which is the thing the title was standing in for. 1600
characters is enough to tell a specific piece from a recycled one and short
enough that 40 fit in a batch without the model losing the earlier entries.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from functools import partial
from typing import NotRequired, TypedDict

from load_sql import load_sql as read_sql

from tools.bootstrap.engine_archive import engine_archive
from tools.bootstrap.engine_config import engine_config

load_sql = partial(read_sql, directory=Path(__file__).parent)

__all__ = [
    "Candidate",
    "NotRequired",
    "Path",
    "TypedDict",
    "clip_body",
    "json",
    "main",
    "select_candidates",
    "sys",
    "write_batches",
]

import json

from review_pass_build_batches_clip_body import review_pass_build_batches_clip_body as clip_body

BATCH = 40
BODY_CHARS = 1600
CLIPS_ARG = 3


from candidate import Candidate
from review_pass_build_batches_write_batches import (
    review_pass_build_batches_write_batches as _write_batches,
)

write_batches = partial(_write_batches, get_batch=partial(globals().__getitem__, "BATCH"))
from select_candidates import select_candidates


def main(argv: list[str]) -> int:
    """Select the candidates, write the batches beside them, and report the count."""
    rows: list[Candidate] = [
        json.loads(line) for line in Path(argv[1]).read_text().splitlines() if line
    ]
    work = Path(argv[2])
    clips = Path(argv[CLIPS_ARG]) if len(argv) > CLIPS_ARG else engine_archive(engine_config())

    candidates = select_candidates(rows, clips)
    write_batches(candidates, work / "batches")
    (work / "candidates.jsonl").write_text(
        "\n".join(json.dumps(row, ensure_ascii=False) for row in candidates) + "\n"
    )
    written = len(list((work / "batches").glob("*.txt")))
    print(f"{len(candidates)} candidates in {written} batches")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
