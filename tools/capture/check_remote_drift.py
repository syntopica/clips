"""Has the published article changed since we captured it?

A consumer-side network pass over the clip store, on the `recover_gone.py`
pattern: opt-in, bounded, and recording what it checked so a re-run does not
repeat it. It runs on this Mac because this Mac already fetches Medium every day
through the harvest, so none of the reasoning that cut the capture service's own
fetch applies here (SPEC:
docs/superpowers/specs/2026-08-04-capture-service-design.md).

It is a different question from the one `clips audit` answers.
`find-source-drift` rehashes the clip **directory** against the ledger and
catches local evidence that changed underneath a page; this asks whether the
**published** article changed, which no local hash can see. It is deliberately
not an audit check: audit is offline and cheap by design - "no new field, no
model, no network" - and giving it a network path changes what running it costs.

**It compares `metadata.json`'s `content_sha256`, over the extracted text.**
Never the ledger's `contentSha256`, which covers `metadata.json` + `index.md` +
`source.html` together: `source.html` differs on every fetch of a dynamic page,
so a comparison built on it would report change for every clip on every run.
That is the always-fires shape this repository has already removed a check for
once, after it flagged 86 of 90 pages.

**The first run was a measurement, not a verdict, and it passed.** 2026-08-04,
seven clips captured the previous day and edited by nobody: **7 unchanged, 0
drifted.** So Medium's extracted text is stable between two fetches of an
unedited article - no clap count or reading time survives extraction - and this
is not another check that fires on everything. That was the open question, and
it is the reason nothing was wired to the result until it was answered.

The same run found the real failure mode, which is not drift: **five requests in
a burst earned four 403s.** Medium's 403 is intermittent and rate-shaped, and
all four came back `unchanged` once the requests were spaced and retried once.
A pass that reported those as failures would be reporting its own impatience.

Usage:
    check_remote_drift.py [--refetch] [--limit N] [--clip <id>] [<clips-repo>]

Without --refetch it lists what it would check and makes no request.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

import hashlib
import json
import sqlite3
import subprocess
from datetime import UTC, datetime
from functools import partial
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from tools.capture.already_checked import already_checked
    from tools.capture.candidates import candidates
    from tools.capture.check import check as _check
    from tools.capture.default_capture_archive import default_capture_archive
    from tools.capture.is_medium import is_medium
    from tools.capture.load_sql import load_sql as read_sql
    from tools.capture.record import record
    from tools.capture.remote_body_sha import remote_body_sha
    from tools.capture.url_index import clip_dirs, connect, read_metadata
else:
    from already_checked import already_checked
    from candidates import candidates
    from check import check as _check
    from default_capture_archive import default_capture_archive
    from is_medium import is_medium
    from load_sql import load_sql as read_sql
    from record import record
    from remote_body_sha import remote_body_sha
    from url_index import clip_dirs, connect, read_metadata

load_sql = partial(read_sql, directory=Path(__file__).parent)

__all__ = [
    "UTC",
    "Any",
    "Path",
    "already_checked",
    "candidates",
    "check",
    "clip_dirs",
    "connect",
    "datetime",
    "default_capture_archive",
    "hashlib",
    "is_medium",
    "json",
    "main",
    "read_metadata",
    "record",
    "remote_body_sha",
    "sqlite3",
    "subprocess",
    "sys",
    "time",
]

import time

CAPTURE_CLI = (
    Path(__file__).parents[1]
    / "clips"
    / "src"
    / "harvest"
    / "article"
    / "capture-medium-article-cli.ts"
)
DEFAULT_LIMIT = 5
MEDIUM_HOSTS = ("medium.com", ".medium.com")
# `https://host/path` splits into ["https:", "", "host", ...], so the host is
# the third segment and a URL with fewer slashes than that has none.
HOST_SEGMENT = 2
# Five requests in a burst earned four 403s on the first measurement run.
# Medium's 403 is intermittent and rate-shaped, which the harvest already knows;
# spacing the requests and retrying once is what turns it back into a fetch.
PAUSE_SECONDS = 5
RETRY_PAUSE_SECONDS = 20

# Sibling of `unavailable` in the same index, and for the same reason: it is
# observational state that `rebuild` cannot reconstruct from the clip
# directories, because it is not derivable from them.
SCHEMA = load_sql("check-remote-drift-1")


check = partial(_check, get_remote_body_sha=partial(globals().__getitem__, "remote_body_sha"))


def main() -> int:
    """Select the clips to check and, with `--refetch`, check them one paced request apart."""
    arguments = sys.argv[1:]
    refetch = "--refetch" in arguments
    limit = DEFAULT_LIMIT
    clip_filter = None
    positional = []
    index = 0
    while index < len(arguments):
        argument = arguments[index]
        if argument == "--limit":
            index += 1
            limit = int(arguments[index])
        elif argument == "--clip":
            index += 1
            clip_filter = arguments[index]
        elif not argument.startswith("--"):
            positional.append(argument)
        index += 1
    repo = Path(positional[0]) if positional else default_capture_archive()

    connection = connect(repo)
    selected = candidates(repo, clip_filter, limit, already_checked(connection))
    if not selected:
        print("no matching clips")
        return 0
    if not refetch:
        for _clip_dir, metadata in selected:
            print(f"{metadata['clip_id']}  {metadata['url']}")
        print(f"\n{len(selected)} clips; pass --refetch to check them")
        return 0

    counts = {"unchanged": 0, "drifted": 0, "failed": 0}
    for position, (_, metadata) in enumerate(selected):
        if position:
            time.sleep(PAUSE_SECONDS)
        outcome = check(connection, metadata)
        counts[outcome] += 1
        print(f"{outcome:<10} {metadata['url']}")
    print(
        f"\n{counts['unchanged']} unchanged, {counts['drifted']} drifted, "
        f"{counts['failed']} could not be fetched"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
