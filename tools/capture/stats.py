"""Stats: extracted from url_index.py."""

from functools import partial
from pathlib import Path
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tools.capture.connect import connect
    from tools.capture.load_sql import load_sql as read_sql
else:
    from connect import connect
    from load_sql import load_sql as read_sql

load_sql = partial(read_sql, directory=Path(__file__).parent)


def stats(repo: Path) -> None:
    """Print one counted line per thing the index knows how to count."""
    connection = connect(repo)
    for label, query in (
        ("captures", load_sql("stats-1")),
        ("distinct content hashes", load_sql("stats-2")),
        ("assets recorded", load_sql("stats-3")),
        ("distinct asset bytes", load_sql("stats-4")),
        ("assets failed", load_sql("stats-5")),
        ("known unavailable urls", load_sql("stats-6")),
    ):
        print(f"{label}: {connection.execute(query).fetchone()[0]}")
