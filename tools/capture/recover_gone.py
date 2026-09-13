"""Try to recover articles the publisher deleted before we captured them.

Fifteen articles were lost between the 2026-07-29 triage and the 2026-07-30
fetch: Medium returned `410 Gone`. They are the direct cost of classifying
before capturing, and the reason the pipeline is being reordered
(SPEC: docs/superpowers/specs/2026-07-30-capture-first-pipeline-design.md).

This is a one-off recovery pass, not part of the capture path. The distinction
matters: capture must not depend on third parties, because that dependency is
the failure this whole redesign removes. But for URLs that are *already* lost,
a third-party archive is strictly better than nothing, and the outcome is
recorded either way - a URL that is not in the Wayback Machine is a permanent
loss, and knowing that is worth the request.

Reads the `[gone-410]` markers out of the triage files, queries the Wayback
availability API, and writes the result into the url index's `unavailable`
table so a future run does not repeat the attempt.

Usage:
    recover_gone.py [--fetch]     query availability; --fetch also downloads
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

import json
import urllib.error
import urllib.parse
import urllib.request
from functools import partial
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tools.capture.default_capture_archive import default_capture_archive
    from tools.capture.gone_urls import gone_urls as _gone_urls
    from tools.capture.load_sql import load_sql as read_sql
    from tools.capture.url_index import connect
    from tools.capture.wayback_snapshot import wayback_snapshot
else:
    from default_capture_archive import default_capture_archive
    from gone_urls import gone_urls as _gone_urls
    from load_sql import load_sql as read_sql
    from url_index import connect
    from wayback_snapshot import wayback_snapshot

load_sql = partial(read_sql, directory=Path(__file__).parent)

__all__ = [
    "UTC",
    "Path",
    "connect",
    "datetime",
    "default_capture_archive",
    "gone_urls",
    "json",
    "main",
    "sys",
    "urllib",
    "wayback_snapshot",
]

from datetime import UTC, datetime

TRIAGE_DIR = Path.home() / "p" / "brain" / "inbox" / "newsletter-triage"
AVAILABILITY = "https://archive.org/wayback/available?url="
TIMEOUT_SECONDS = 30
USER_AGENT = "capture-service-recovery/1.0 (personal archive; contact via repo)"


gone_urls = partial(_gone_urls, get_triage_dir=partial(globals().__getitem__, "TRIAGE_DIR"))


def main() -> int:
    """Ask the Wayback Machine about every `[gone-410]` URL and record what it answers."""
    urls = gone_urls()
    if not urls:
        print("no [gone-410] markers found")
        return 0
    connection = connect(default_capture_archive())
    now = datetime.now(UTC).isoformat()
    recovered = lost = 0
    for url in urls:
        snapshot = wayback_snapshot(url)
        connection.execute(
            load_sql("recover-gone-1"),
            (url, 410, now, now, snapshot),
        )
        if snapshot:
            recovered += 1
            print(f"ARCHIVED  {url}\n          {snapshot}")
        else:
            lost += 1
            print(f"LOST      {url}")
    connection.commit()
    print(f"\n{len(urls)} gone urls: {recovered} in the archive, {lost} unrecoverable")
    return 0


if __name__ == "__main__":
    sys.exit(main())
