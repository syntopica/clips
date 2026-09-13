"""Lookup capture: extracted from classifications.py."""

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


def lookup_capture(connection: sqlite3.Connection, url: str) -> str | None:
    """The capture id already recorded for this URL, or None if nothing captured it."""
    row = connection.execute(load_sql("lookup-capture-1"), (normalize(url),)).fetchone()
    return row[0] if row else None
