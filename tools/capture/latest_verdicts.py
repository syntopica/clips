"""Latest verdicts: extracted from read_batch.py."""

import json
from pathlib import Path


def latest_verdicts(repo: Path) -> dict[str, str]:
    """Normalized URL to its newest bucket, later run files overwriting earlier ones."""
    verdicts: dict[str, str] = {}
    for path in sorted(repo.glob("classifications/*/*.jsonl")):
        for line in path.read_text().splitlines():
            if line.strip():
                row = json.loads(line)
                verdicts[row["normalized_url"]] = row["bucket"]
    return verdicts
