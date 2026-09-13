"""Review pass: url index."""

import sqlite3
from pathlib import Path

from tests.load_sql import load_sql


def _url_index(clips: Path, pairs: list[tuple[str, str]]) -> None:
    connection = sqlite3.connect(clips / "url-index.sqlite3")
    connection.execute(load_sql("review_pass/create-captures"))
    connection.executemany(load_sql("review_pass/insert-captures"), pairs)
    connection.commit()
    connection.close()
