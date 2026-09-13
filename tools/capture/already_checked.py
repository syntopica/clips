"""Already checked: extracted from check_remote_drift.py."""

import sqlite3
from functools import partial
from pathlib import Path
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tools.capture.load_sql import load_sql as read_sql
else:
    from load_sql import load_sql as read_sql

load_sql = partial(read_sql, directory=Path(__file__).parent)

SCHEMA = load_sql("already-checked-1")


def already_checked(connection: sqlite3.Connection) -> set[str]:
    """The clips a previous run resolved, which this run therefore skips.

    A fetch that failed is not a result, so it is not remembered as one - only
    `unchanged` and `drifted` skip a re-run.
    """
    connection.executescript(SCHEMA)
    return {row[0] for row in connection.execute(load_sql("already-checked-2"))}
