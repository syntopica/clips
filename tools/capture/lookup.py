"""Lookup: extracted from url_index.py."""

from functools import partial
from pathlib import Path
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tools.capture.capture_url_index_normalize import capture_url_index_normalize as normalize
    from tools.capture.connect import connect
    from tools.capture.load_sql import load_sql as read_sql
else:
    from capture_url_index_normalize import capture_url_index_normalize as normalize
    from connect import connect
    from load_sql import load_sql as read_sql

load_sql = partial(read_sql, directory=Path(__file__).parent)


def lookup(repo: Path, url: str) -> None:
    """Print the capture id and clip directory for a URL, or nothing if it is new."""
    connection = connect(repo)
    row = connection.execute(
        load_sql("lookup-1"),
        (normalize(url),),
    ).fetchone()
    if row:
        print(f"{row[0]}\t{row[1]}")
