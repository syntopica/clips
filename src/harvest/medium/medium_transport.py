"""Fetch one Medium URL, or POST one GraphQL body, using Python's TLS stack.

Medium sits behind Cloudflare, and the `cf_clearance` cookie Chrome earned is
bound to the TLS fingerprint of the client that earned it. Measured 2026-07-29
with an identical cookie jar and User-Agent: Python returns 200, while Node's
`fetch`, Node's `https` module and `curl` all return 403. Reordering ciphers and
adding browser-like headers changed nothing, because the rejection happens below
the header layer.

So the transport - and only the transport - runs here. Every piece of logic that
can be tested stays in TypeScript behind the injected `post` seam; this script
is the smallest possible thing that has to exist outside it.

Usage:
    medium_transport.py get <url>
    medium_transport.py post <graphql-url>   # request body on stdin

Headers arrive as JSON in the MEDIUM_HEADERS environment variable rather than on
argv, so cookies never appear in the process table.
"""

import gzip
import json
import os
import sys
import urllib.error
import urllib.request


def run() -> int:
    """Write the response body to stdout; 1 when the far end answers with an HTTP error."""
    mode, url = sys.argv[1], sys.argv[2]
    headers = json.loads(os.environ["MEDIUM_HEADERS"])
    data = sys.stdin.buffer.read() if mode == "post" else None
    request = urllib.request.Request(url, data=data, headers=headers)
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            body = response.read()
            if response.headers.get("Content-Encoding") == "gzip":
                body = gzip.decompress(body)
            sys.stdout.write(body.decode("utf-8", errors="replace"))
            return 0
    except urllib.error.HTTPError as error:
        sys.stderr.write(f"{url} returned {error.code}\n")
        return 1


if __name__ == "__main__":
    sys.exit(run())
