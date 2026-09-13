"""Wayback snapshot: extracted from recover_gone.py."""

import json
import urllib.error
import urllib.parse
import urllib.request

AVAILABILITY = "https://archive.org/wayback/available?url="

TIMEOUT_SECONDS = 30

USER_AGENT = "capture-service-recovery/1.0 (personal archive; contact via repo)"


def wayback_snapshot(url: str) -> str | None:
    """The closest archived snapshot URL, or None if the archive has none."""
    request = urllib.request.Request(
        AVAILABILITY + urllib.parse.quote(url, safe=""),
        headers={"User-Agent": USER_AGENT},
    )
    try:
        with urllib.request.urlopen(request, timeout=TIMEOUT_SECONDS) as response:
            payload = json.loads(response.read())
    except Exception:
        return None
    closest = payload.get("archived_snapshots", {}).get("closest", {})
    return closest.get("url") if closest.get("available") else None
