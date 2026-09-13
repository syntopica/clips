"""Connect: extracted from url_index.py."""

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

SCHEMA = load_sql("connect-1")


def connect(repo: Path) -> sqlite3.Connection:
    """Open the repository's index, creating any table the schema is missing."""
    connection = sqlite3.connect(repo / INDEX_NAME)
    connection.executescript(SCHEMA)
    return connection
