"""Fetch: extracted from page_transport.py."""

import gzip
import urllib.error
import urllib.request
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tools.clips.src.capture.https_only_redirect_handler import HttpsOnlyRedirectHandler
else:
    from https_only_redirect_handler import HttpsOnlyRedirectHandler

TIMEOUT_SECONDS = 30

MAX_BYTES = 16 * 1024 * 1024


def capture_page_transport_fetch(url: str, headers: dict[str, str]) -> bytes:
    """The page's bytes, capped while reading rather than trusted from a header.

    `Content-Length` is a claim by the far end and is absent on a chunked
    response, so the cap is enforced against what actually arrives.
    """
    opener = urllib.request.build_opener(HttpsOnlyRedirectHandler)
    with opener.open(
        urllib.request.Request(url, headers=headers), timeout=TIMEOUT_SECONDS
    ) as response:
        body: bytes = response.read(MAX_BYTES + 1)
        if len(body) > MAX_BYTES:
            raise ValueError(f"response exceeds {MAX_BYTES} bytes")
        if response.headers.get("Content-Encoding") == "gzip":
            body = gzip.decompress(body)
        return body
