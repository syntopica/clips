"""Select: extracted from read_batch.py."""

import sqlite3
from functools import partial
from pathlib import Path
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tools.capture.latest_verdicts import latest_verdicts
    from tools.capture.load_sql import load_sql as read_sql
else:
    from latest_verdicts import latest_verdicts
    from load_sql import load_sql as read_sql

load_sql = partial(read_sql, directory=Path(__file__).parent)


def select_batch(repo: Path, bucket: str, offset: int, count: int) -> list[tuple[str, str]]:
    """The batch's (url, clip_dir) pairs: one bucket, ordered by URL, then sliced.

    Deterministic on purpose - `record_reading.py` reconstructs a batch's
    membership by calling this with the same arguments rather than by reading a
    manifest.
    """
    connection = sqlite3.connect(repo / "url-index.sqlite3")
    verdicts = latest_verdicts(repo)
    rows = [
        (url, clip_dir)
        for url, clip_dir in connection.execute(load_sql("select-1"))
        if verdicts.get(url, "unknown") == bucket
    ]
    return rows[offset : offset + count]
