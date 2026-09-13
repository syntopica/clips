"""Rebuild: extracted from url_index.py."""

from functools import partial
from pathlib import Path
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tools.capture.capture_url_index_normalize import capture_url_index_normalize as normalize
    from tools.capture.clip_dirs import clip_dirs
    from tools.capture.connect import connect
    from tools.capture.load_sql import load_sql as read_sql
    from tools.capture.read_metadata import read_metadata
else:
    from capture_url_index_normalize import capture_url_index_normalize as normalize
    from clip_dirs import clip_dirs
    from connect import connect
    from load_sql import load_sql as read_sql
    from read_metadata import read_metadata

load_sql = partial(read_sql, directory=Path(__file__).parent)


def rebuild(repo: Path) -> None:
    """Rewrite the `captures` table from the clip directories, which are the truth."""
    connection = connect(repo)
    connection.execute(load_sql("rebuild-1"))
    rows = []
    for clip_dir in clip_dirs(repo):
        metadata = read_metadata(clip_dir)
        url = metadata.get("url") or metadata.get("normalized_url")
        if not url:
            continue
        # A clip that names the full capture of the same article contributes no
        # row: the URL already has one, and the index answers "do we have this?"
        # rather than "how many directories hold it". Without this the winner is
        # whichever directory sorts last, which is an accident, not a decision.
        if metadata.get("duplicate_of"):
            continue
        rows.append(
            (
                normalize(url),
                url,
                metadata.get("clip_id") or clip_dir.name,
                str(clip_dir.relative_to(repo)),
                metadata.get("content_sha256") or metadata.get("contentSha256"),
                metadata.get("title"),
                metadata.get("captured_at") or metadata.get("capturedAt"),
                "captured",
            )
        )
    connection.executemany(load_sql("rebuild-2"), rows)
    connection.commit()
    print(f"indexed {len(rows)} captures")
