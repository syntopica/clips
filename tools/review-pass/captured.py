"""Captured: extracted from map_to_clips.py."""

import re
import sqlite3
from functools import partial
from pathlib import Path

from load_sql import load_sql as read_sql

load_sql = partial(read_sql, directory=Path(__file__).parent)

POST_ID = re.compile(r"([0-9a-f]{8,14})$")


def captured(clips: Path) -> dict[str, str]:
    """Return the clip directory holding each captured post id, read-only."""
    connection = sqlite3.connect(f"file:{clips / 'url-index.sqlite3'}?mode=ro", uri=True)
    try:
        rows = connection.execute(load_sql("captured-1")).fetchall()
    finally:
        connection.close()
    directories: dict[str, str] = {}
    for url, directory in rows:
        match = POST_ID.search(url)
        if match:
            directories[match.group(1)] = directory
    return directories
