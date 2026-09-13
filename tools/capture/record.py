"""Record: extracted from check_remote_drift.py."""

import sqlite3
from datetime import UTC, datetime
from functools import partial
from pathlib import Path
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from tools.capture.load_sql import load_sql as read_sql
else:
    from load_sql import load_sql as read_sql

load_sql = partial(read_sql, directory=Path(__file__).parent)


def record(
    connection: sqlite3.Connection,
    metadata: dict[str, Any],
    remote_sha: str | None,
    outcome: str,
) -> None:
    """Write one row into `remote_checks`, committing it so a crash keeps the result."""
    connection.execute(
        load_sql("record-1"),
        (
            metadata["clip_id"],
            metadata["url"],
            datetime.now(UTC).isoformat(),
            metadata["content_sha256"],
            remote_sha,
            outcome,
        ),
    )
    connection.commit()
