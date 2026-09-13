"""Remote body sha: extracted from check_remote_drift.py."""

import hashlib
import json
import subprocess
import time
from pathlib import Path

CAPTURE_CLI = (
    Path(__file__).parents[1]
    / "clips"
    / "src"
    / "harvest"
    / "article"
    / "capture-medium-article-cli.ts"
)

RETRY_PAUSE_SECONDS = 20


def remote_body_sha(url: str) -> str:
    """The sha256 of the article's extracted text as it stands right now.

    The same fetch and the same extractor the capture used, through the same
    TypeScript seam, so a difference in the hash is a difference in the article
    rather than a difference in how it was read.
    """
    for attempt in range(2):
        if attempt:
            time.sleep(RETRY_PAUSE_SECONDS)
        result = subprocess.run(
            ["node", str(CAPTURE_CLI), url],
            capture_output=True,
            text=True,
            timeout=180,
            check=False,
        )
        if result.returncode == 0:
            body = json.loads(result.stdout)["article"]["body"]
            return hashlib.sha256(body.encode("utf-8")).hexdigest()
    raise RuntimeError(result.stderr.strip().splitlines()[-1] or "fetch failed")
