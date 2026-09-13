"""Capture article: extracted from normalize_thin_clip.py."""

import json
import subprocess
from pathlib import Path
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from tools.capture.thin_clip_error import ThinClipError
else:
    from thin_clip_error import ThinClipError

CAPTURE_CLI = (
    Path(__file__).parents[1]
    / "clips"
    / "src"
    / "harvest"
    / "article"
    / "capture-medium-article-cli.ts"
)


def capture_article(url: str) -> dict[str, Any]:
    """Fetch and extract one Medium article through the TypeScript session.

    Chrome's cookie store is decrypted in TypeScript and the Apollo-state
    extractor is 900 lines of it, so this shells out rather than carrying a
    second implementation of either. The transport underneath is the same
    `medium_transport.py` the harvest uses, for the same reason: Medium's
    Cloudflare rejects Node's and curl's TLS fingerprints and accepts Python's.
    """
    result = subprocess.run(
        ["node", str(CAPTURE_CLI), url],
        capture_output=True,
        text=True,
        timeout=180,
        check=False,
    )
    if result.returncode != 0:
        raise ThinClipError(f"{url}: {result.stderr.strip() or 'fetch failed'}")
    captured: dict[str, Any] = json.loads(result.stdout)
    return captured
