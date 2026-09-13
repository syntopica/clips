"""Fetch one web page, using Python's TLS stack.

The drain reaches arbitrary hosts, and a browser's TLS fingerprint is what gets
past the bot walls in front of a good share of them. Measured 2026-08-04 with
the same User-Agent and no cookies: Node's `fetch` returned 403 from both
medium.com and elpais.com, while this returned 200 from both.

That is the same reason `harvest/medium/medium_transport.py` exists, and the
finding turned out not to be about Medium: `cf_clearance` and its equivalents
are bound to the fingerprint of the client that earned them, so the question is
who is asking rather than what is being asked for.

Kept separate from the Medium transport rather than merged into it. That one
also POSTs GraphQL and carries a session; this one is a page fetcher with
caps, and giving one script both jobs would mean every caller inherits the
other's assumptions.

Headers arrive as JSON in PAGE_HEADERS rather than on argv, so a cookie never
appears in the process table.

SPEC: docs/superpowers/specs/2026-08-04-general-extraction-design.md

Usage:
    page_transport.py <url>
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

import gzip
import json
import os
import urllib.error
import urllib.request
from http.client import HTTPMessage
from typing import IO, TYPE_CHECKING

__all__ = [
    "IO",
    "HTTPMessage",
    "HttpsOnlyRedirectHandler",
    "fetch",
    "gzip",
    "json",
    "os",
    "run",
    "sys",
    "urllib",
]


if TYPE_CHECKING:
    from tools.clips.src.capture.capture_page_transport_fetch import (
        capture_page_transport_fetch as fetch,
    )
    from tools.clips.src.capture.https_only_redirect_handler import HttpsOnlyRedirectHandler
else:
    from capture_page_transport_fetch import capture_page_transport_fetch as fetch
    from https_only_redirect_handler import HttpsOnlyRedirectHandler

TIMEOUT_SECONDS = 30
MAX_BYTES = 16 * 1024 * 1024
MAX_REDIRECTS = 5


def main() -> int:
    """Write the page to stdout; 2 for a non-https url, 1 for a failed fetch, 0 otherwise."""
    url = sys.argv[1]
    if not url.lower().startswith("https://"):
        sys.stderr.write(f"refusing a non-https url: {url}\n")
        return 2
    try:
        sys.stdout.write(
            fetch(url, json.loads(os.environ["PAGE_HEADERS"])).decode("utf-8", errors="replace")
        )
        return 0
    except urllib.error.HTTPError as error:
        sys.stderr.write(f"{url} returned {error.code}\n")
        return 1
    except Exception as error:
        sys.stderr.write(f"{url}: {error}\n")
        return 1


run = main

if __name__ == "__main__":
    raise SystemExit(main())
