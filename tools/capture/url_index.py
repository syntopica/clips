"""The capture store's URL index: what we already have, so nothing is fetched twice.

One SQLite file at the root of the clips repository. It answers the only two
questions the capture stage needs before spending a request:

    have we captured this URL?          -> lookup(url)
    have we captured these bytes?       -> content hash column

Why SQLite rather than a JSON file: the index is read on every capture and
written concurrently by different lanes (extension, Shortcut, harvest), and
SQLite gives atomic writes and an index on the lookup column for free. Why in
the clips repository rather than the brain: it describes captures, and the
capture store is deliberately separate so the wiki's history stays light
(SPEC: docs/superpowers/specs/2026-07-30-capture-first-pipeline-design.md).

The file is derived state - `rebuild` reconstructs it from the clip directories,
which remain the source of truth. It is committed anyway, because a fresh clone
should not have to walk 365 directories before its first capture.

Usage:
    url_index.py rebuild [<clips-repo>]     scan clip dirs, rewrite the index
    url_index.py lookup <url> [<clips-repo>]  print the capture id, or nothing
    url_index.py stats [<clips-repo>]
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

import json
import sqlite3
from collections.abc import Iterator
from functools import partial
from typing import TYPE_CHECKING, Any
from urllib.parse import parse_qs, urlsplit

if TYPE_CHECKING:
    from tools.capture.capture_url_index_normalize import capture_url_index_normalize as normalize
    from tools.capture.clip_dirs import clip_dirs
    from tools.capture.connect import connect
    from tools.capture.default_capture_archive import default_capture_archive
    from tools.capture.load_sql import load_sql as read_sql
    from tools.capture.lookup import lookup
    from tools.capture.read_metadata import read_metadata
    from tools.capture.rebuild import rebuild
    from tools.capture.stats import stats
else:
    from capture_url_index_normalize import capture_url_index_normalize as normalize
    from clip_dirs import clip_dirs
    from connect import connect
    from default_capture_archive import default_capture_archive
    from load_sql import load_sql as read_sql
    from lookup import lookup
    from read_metadata import read_metadata
    from rebuild import rebuild
    from stats import stats

load_sql = partial(read_sql, directory=Path(__file__).parent)

__all__ = [
    "Any",
    "Iterator",
    "Path",
    "clip_dirs",
    "connect",
    "default_capture_archive",
    "json",
    "lookup",
    "main",
    "normalize",
    "parse_qs",
    "read_metadata",
    "rebuild",
    "sqlite3",
    "stats",
    "sys",
    "urlsplit",
]


INDEX_NAME = "url-index.sqlite3"

SCHEMA = load_sql("url-index-1")


# Hosts where the query carries the page's identity, and which parameters carry
# it. Everywhere else the query is tracking noise and is dropped; on
# `youtube.com/watch` the same rule erases the video, so every watch URL keys as
# `https://www.youtube.com/watch` and the second video captured is read as a
# duplicate of the first. Found 2026-08-04, when a citation backfill posted a
# video and the service answered `already_captured` with an unrelated clip from
# a week earlier. `youtu.be` is absent on purpose: it carries the id in the path.
#
# This table and the one in `capture-service`'s `identityQueryParams.ts` must stay
# in step, for the same reason the two `normalize` implementations do.
IDENTITY_QUERY_PARAMS = {
    "youtube.com": ("v",),
    "www.youtube.com": ("v",),
    "m.youtube.com": ("v",),
}


def main() -> int:
    """Dispatch `rebuild`, `lookup` or `stats`; anything else prints the usage."""
    arguments = sys.argv[1:]
    if not arguments:
        print(__doc__)
        return 2
    command, *operands = arguments
    if command == "lookup":
        repo = Path(operands[1]) if len(operands) > 1 else default_capture_archive()
        lookup(repo, operands[0])
        return 0
    if command not in ("rebuild", "stats"):
        print(__doc__)
        return 2
    repo = Path(operands[0]) if operands else default_capture_archive()
    if command == "rebuild":
        rebuild(repo)
    else:
        stats(repo)
    return 0


if __name__ == "__main__":
    sys.exit(main())
