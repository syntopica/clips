"""Check: extracted from check_remote_drift.py."""

import sqlite3
from collections.abc import Callable
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from tools.capture.record import record
else:
    from record import record


def check(
    connection: sqlite3.Connection,
    metadata: dict[str, Any],
    *,
    get_remote_body_sha: Callable[[], Callable[..., str]],
) -> str:
    """Fetch one article and record whether its text still hashes to what we captured.

    Returns `unchanged`, `drifted` or `failed`; a failure is recorded with the
    reason as its outcome so the next run tries it again.
    """
    remote_body_sha = get_remote_body_sha()
    try:
        remote_sha = remote_body_sha(metadata["url"])
    except Exception as error:
        record(connection, metadata, None, str(error))
        return "failed"
    unchanged = remote_sha == metadata["content_sha256"]
    record(connection, metadata, remote_sha, "unchanged" if unchanged else "drifted")
    return "unchanged" if unchanged else "drifted"
