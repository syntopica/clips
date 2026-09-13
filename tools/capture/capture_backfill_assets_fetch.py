"""Fetch: extracted from backfill_assets.py."""

import urllib.error
import urllib.request

TIMEOUT_SECONDS = 30

MAX_ASSET_BYTES = 25 * 1024 * 1024

USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/140.0 Safari/537.36"
)


def capture_backfill_assets_fetch(url: str) -> tuple[bytes | None, str, str | None]:
    """Returns (body, status, content_type). Status is 'ok' or a reason."""
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(request, timeout=TIMEOUT_SECONDS) as response:
            body = response.read(MAX_ASSET_BYTES + 1)
            if len(body) > MAX_ASSET_BYTES:
                return None, "too-large", None
            return body, "ok", response.headers.get("Content-Type")
    except urllib.error.HTTPError as error:
        return None, f"http-{error.code}", None
    except Exception as error:
        return None, f"error-{type(error).__name__}", None
