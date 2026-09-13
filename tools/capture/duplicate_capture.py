"""Duplicate capture: extracted from normalize_thin_clip.py."""

import sqlite3
from functools import partial
from pathlib import Path
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tools.capture.load_sql import load_sql as read_sql
    from tools.capture.url_index import normalize
else:
    from load_sql import load_sql as read_sql
    from url_index import normalize

load_sql = partial(read_sql, directory=Path(__file__).parent)


def duplicate_capture(connection: sqlite3.Connection, url: str) -> tuple[str, str] | None:
    """The full capture of this URL already in the store, if there is one.

    The lookup goes through `url_index.normalize`, imported rather than copied:
    an index answering a different question than the one it was built from is
    worse than no index.
    """
    row = connection.execute(
        load_sql("duplicate-capture-1"),
        (normalize(url),),
    ).fetchone()
    return (row[0], row[1]) if row else None
