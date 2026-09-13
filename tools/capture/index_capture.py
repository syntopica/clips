"""Index capture: extracted from normalize_thin_clip.py."""

import sqlite3
from functools import partial
from pathlib import Path
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from tools.capture.load_sql import load_sql as read_sql
    from tools.capture.url_index import normalize
else:
    from load_sql import load_sql as read_sql
    from url_index import normalize

load_sql = partial(read_sql, directory=Path(__file__).parent)


def index_capture(
    connection: sqlite3.Connection, metadata: dict[str, Any], clip_dir: Path, repo: Path
) -> None:
    """One `captures` row for a clip the index does not know about yet."""
    connection.execute(
        load_sql("index-capture-1"),
        (
            normalize(metadata["url"]),
            metadata["url"],
            metadata["clip_id"],
            str(clip_dir.relative_to(repo)),
            metadata["content_sha256"],
            metadata["title"],
            metadata["clipped_at"],
            "captured",
        ),
    )
    connection.commit()
