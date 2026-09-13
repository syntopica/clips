"""Rows to push: extracted from push_index_to_service.py."""

import sqlite3
from functools import partial
from pathlib import Path
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tools.capture.load_sql import load_sql as read_sql
else:
    from load_sql import load_sql as read_sql

load_sql = partial(read_sql, directory=Path(__file__).parent)

INDEX_NAME = "url-index.sqlite3"


def rows_to_push(repo: Path, limit: int) -> list[tuple[str, str]]:
    """Every indexed (url, clip_dir) pair in capture order, truncated to `limit`."""
    connection = sqlite3.connect(repo / INDEX_NAME)
    rows: list[tuple[str, str]] = connection.execute(load_sql("rows-to-push-1")).fetchall()
    connection.close()
    return rows[:limit] if limit else rows
