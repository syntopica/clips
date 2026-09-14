#!/usr/bin/env python3
"""Publish what the clip store already knows to the capture service.

The service has only ever heard of the phone's captures, so `GET /have` answers
"no" for essentially the whole history - and a browser extension reading it would
paint every already-clipped page as new. This pushes the rows in
`url-index.sqlite3` across: the URL, the clip directory, and the state that
directory's bucket implies.

Re-runnable by construction, which is the point rather than a convenience: the
service is a mirror of the ledger, and re-running this is how a mirror that
drifted is repaired. `POST /api/capture` is idempotent on the normalised URL and
the `PATCH` is last-write-wins.

The PATCH also marks each capture drained, and that is required rather than
incidental: an undrained row is inbox work, and a thousand of them would send
`clips drain` off to promote articles the store already has.

Usage:
    CAPTURE_TOKEN=... python3 push_index_to_service.py --dry-run
    CAPTURE_TOKEN=... python3 push_index_to_service.py --limit 20
    CAPTURE_TOKEN=... python3 push_index_to_service.py

SPEC: ~/p/wiki/docs/superpowers/specs/2026-08-04-clip-state-in-the-browser-design.md
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

import sqlite3
from dataclasses import dataclass
from functools import partial
from typing import TYPE_CHECKING, Any

__all__ = [
    "Any",
    "Path",
    "Service",
    "argparse",
    "call",
    "clipped_at",
    "dataclass",
    "json",
    "main",
    "os",
    "push",
    "rows_to_push",
    "sqlite3",
    "state_for",
    "sys",
    "urllib",
]

import argparse
import json
import os
import urllib.error
import urllib.request

from tools.bootstrap.engine_archive import engine_archive
from tools.bootstrap.engine_config import engine_config

INDEX_NAME = "url-index.sqlite3"
REQUEST_TIMEOUT_SECONDS = 30

BUCKET_STATES = {
    "clips/pending/": "captured",
    "clips/processed/": "ingested",
    "clips/needs-claude/": "needs-claude",
}


if TYPE_CHECKING:
    from tools.capture.call import call
    from tools.capture.clipped_at import clipped_at
    from tools.capture.push import push as _push
    from tools.capture.rows_to_push import rows_to_push
    from tools.capture.service import Service
    from tools.capture.state_for import state_for
else:
    from call import call
    from clipped_at import clipped_at
    from push import push as _push
    from rows_to_push import rows_to_push
    from service import Service
    from state_for import state_for

push = partial(_push, get_call=partial(globals().__getitem__, "call"))


def main() -> int:
    """Push every indexed capture the service does not know, reporting per-row failures."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo", type=Path)
    parser.add_argument("--origin")
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    token = os.environ.get("CAPTURE_TOKEN", "")
    if not token and not args.dry_run:
        print("CAPTURE_TOKEN is not set", file=sys.stderr)
        return 2

    # The instance is read only for what argv left unsaid, so a fully explicit
    # invocation needs no instance at all.
    repo, origin = args.repo, args.origin
    if repo is None or origin is None:
        config = engine_config()
        repo = repo if repo is not None else engine_archive(config)
        origin = origin if origin is not None else config.capture_origin
    if origin is None:
        print("No capture service: set capture.origin or pass --origin", file=sys.stderr)
        return 2

    service = Service(origin, token)
    rows = rows_to_push(repo, args.limit)
    counts = {"pushed": 0, "skipped": 0, "failed": 0}
    for url, clip_dir in rows:
        state = state_for(clip_dir)
        if state is None:
            counts["skipped"] += 1
            print(f"skip (bucket unknown): {clip_dir}")
            continue
        if args.dry_run:
            counts["pushed"] += 1
            continue
        try:
            push(service, repo, url, clip_dir, state)
            counts["pushed"] += 1
        except (urllib.error.URLError, json.JSONDecodeError, ValueError) as error:
            counts["failed"] += 1
            print(f"failed: {url}: {error}", file=sys.stderr)

    print(
        f"pushed {counts['pushed']}, skipped {counts['skipped']}, "
        f"failed {counts['failed']} of {len(rows)}"
    )
    return 1 if counts["failed"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
