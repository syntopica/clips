"""Clipresult: extracted from backfill_assets.py."""

from typing import TypedDict


class ClipResult(TypedDict, total=False):
    """What one clip's backfill did, in the shape `main` sums up.

    Every key is optional because the four outcomes are disjoint: a clip with no
    markup carries `skipped`, a dry run carries `would_fetch`, and a real run
    carries `ok` and `failed`.
    """

    clip: str
    skipped: str
    would_fetch: int
    ok: int
    failed: int
