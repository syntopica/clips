"""Fetch every remote asset a captured page references.

The point is that the capture stops depending on someone else's CDN.

Today `source.html` holds the page markup with remote `<img src>` values.
Measured 2026-07-30: 4,142 image tags across 365 clips, 95% of them on
`miro.medium.com`. When that CDN rotates, every benchmark table and architecture
diagram in the archive becomes a broken link, which makes the retention
guarantee in SCHEMA.md true for text and false for figures.

This walks the existing clips, fetches what they reference, writes the bytes to
`assets/<sha256>.<ext>`, rewrites `source.html` to point at them, and records
one row per asset in the url index - including the failures, because a 404 today
is evidence about how long these links survive.

Deliberate choices, from the design decisions on 2026-07-30:
  - Save everything. No allowlist of "useful" types, no size threshold.
  - For a `srcset`, take the largest candidate only: the entries are the same
    picture at different sizes, so one keeps all the information at a fraction
    of the bytes, and picking the largest reads an attribute rather than
    judging an image.
  - Partial capture is success recorded as partial. One dead image does not
    fail a clip.

Usage:
    backfill_assets.py <clip-dir>...        specific clips
    backfill_assets.py --all [--limit N]    every clip missing assets/
    backfill_assets.py --dry-run --all      count what would be fetched
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

import hashlib
import html as html_module
import json
import mimetypes
import sqlite3
import urllib.error
import urllib.request
from collections.abc import Iterator
from datetime import UTC, datetime
from functools import partial
from typing import TYPE_CHECKING, TypedDict

__all__ = [
    "UTC",
    "ClipResult",
    "Iterator",
    "Path",
    "TypedDict",
    "asset_urls",
    "backfill_clip",
    "connect",
    "datetime",
    "default_capture_archive",
    "extension_for",
    "fetch",
    "hashlib",
    "html_module",
    "json",
    "largest_srcset_candidate",
    "main",
    "mimetypes",
    "pending",
    "re",
    "sqlite3",
    "sys",
    "urllib",
]

import re

if TYPE_CHECKING:
    from tools.capture.asset_urls import asset_urls
    from tools.capture.backfill_clip import backfill_clip as _backfill_clip
    from tools.capture.capture_backfill_assets_fetch import capture_backfill_assets_fetch as fetch
    from tools.capture.clip_result import ClipResult
    from tools.capture.default_capture_archive import default_capture_archive
    from tools.capture.extension_for import extension_for
    from tools.capture.largest_srcset_candidate import largest_srcset_candidate
    from tools.capture.pending import pending
    from tools.capture.url_index import connect
else:
    from asset_urls import asset_urls
    from backfill_clip import backfill_clip as _backfill_clip
    from capture_backfill_assets_fetch import capture_backfill_assets_fetch as fetch
    from clip_result import ClipResult
    from default_capture_archive import default_capture_archive
    from extension_for import extension_for
    from largest_srcset_candidate import largest_srcset_candidate
    from pending import pending
    from url_index import connect


TIMEOUT_SECONDS = 30
MAX_ASSET_BYTES = 25 * 1024 * 1024
# A path suffix longer than this is not a file extension - it is the tail of a
# CDN path that happens to hold a dot - so the Content-Type is asked instead.
MAX_EXTENSION_LENGTH = 5
USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/140.0 Safari/537.36"
)


IMG_TAG = re.compile(r"<img\b[^>]*>", re.IGNORECASE)
SRC_ATTR = re.compile(r'\bsrc="([^"]+)"', re.IGNORECASE)
SRCSET_ATTR = re.compile(r'\bsrcset="([^"]+)"', re.IGNORECASE)


backfill_clip = partial(_backfill_clip, get_fetch=partial(globals().__getitem__, "fetch"))


def main() -> int:
    """Parse `--all`, `--limit` and `--dry-run`, then back the selected clips up."""
    args = sys.argv[1:]
    if not args:
        print(__doc__)
        return 2
    dry_run = "--dry-run" in args
    args = [a for a in args if a != "--dry-run"]
    limit = None
    if "--limit" in args:
        index = args.index("--limit")
        limit = int(args[index + 1])
        del args[index : index + 2]

    repo = default_capture_archive()
    connection = connect(repo)
    targets = list(pending(repo)) if args == ["--all"] else [Path(a) for a in args]
    if limit:
        targets = targets[:limit]

    total_ok = total_failed = total_would = 0
    for clip_dir in targets:
        result = backfill_clip(clip_dir, connection, dry_run)
        total_ok += result.get("ok", 0)
        total_failed += result.get("failed", 0)
        total_would += result.get("would_fetch", 0)
        if not dry_run and (result.get("ok") or result.get("failed")):
            print(f"{result['clip']}: {result.get('ok', 0)} ok, {result.get('failed', 0)} failed")
    if dry_run:
        print(f"{len(targets)} clips, {total_would} assets would be fetched")
    else:
        print(f"done: {len(targets)} clips, {total_ok} assets, {total_failed} failed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
