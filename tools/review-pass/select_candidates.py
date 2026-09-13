from functools import partial
from pathlib import Path

from load_sql import load_sql as read_sql

load_sql = partial(read_sql, directory=Path(__file__).parent)

"""Select candidates: extracted from build_batches.py."""


from candidate import Candidate
from review_pass_build_batches_clip_body import review_pass_build_batches_clip_body as clip_body


def select_candidates(rows: list[Candidate], clips: Path) -> list[Candidate]:
    """Return the rows a person still has to decide about, body included.

    A row already cited by a page has been decided, and an uncaptured one has
    no clip to read; both are dropped. So is a row whose clip directory is
    missing, because there is nothing to show the model.
    """
    candidates: list[Candidate] = []
    for row in rows:
        if row["in_wiki"] or row["bucket"] == "uncaptured":
            continue
        index = clips / row["clip_dir"] / "index.md"
        if not index.exists():
            continue
        row["body"] = clip_body(index)
        candidates.append(row)
    return candidates
