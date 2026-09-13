"""Import triage: extracted from classifications.py."""

import json
import re
from pathlib import Path
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from tools.capture.bucket_for import bucket_for
    from tools.capture.lookup_capture import lookup_capture
    from tools.capture.runs_dir import runs_dir
    from tools.capture.url_index import connect, normalize
else:
    from bucket_for import bucket_for
    from lookup_capture import lookup_capture
    from runs_dir import runs_dir
    from url_index import connect, normalize

ENTRY = re.compile(r"^\s*-\s+(?:(\[[^\]]*\])\s+)?\[([^\]]*)\]\((https?://[^\s)]+)\)")


def import_triage(repo: Path, triage_dir: Path) -> None:
    """Seed run zero from the existing triage markdown, so history is not lost.

    The triage files are the only record of how the 2026-07-29 harvest was
    classified. Importing them as a run means the new store starts with the
    decisions already made rather than an empty slate, and the later audit
    remains reproducible.
    """
    connection = connect(repo)
    rows: list[dict[str, Any]] = []
    for path in sorted(triage_dir.rglob("*.md")):
        if path.name in {"README.md", "NOT-INGESTED.md"}:
            continue
        topic = path.stem
        heading_bucket = "review"
        for line in path.read_text(errors="ignore").splitlines():
            lowered = line.lower()
            if lowered.startswith("## ingest"):
                heading_bucket = "ingest"
                continue
            if lowered.startswith("## review"):
                heading_bucket = "review"
                continue
            if lowered.startswith("## rejected"):
                heading_bucket = "rejected"
                continue
            match = ENTRY.match(line)
            if not match:
                continue
            marker, title, url = match.groups()
            marker = marker or ""
            rows.append(
                {
                    "capture_id": lookup_capture(connection, url),
                    "normalized_url": normalize(url),
                    "title": title,
                    "bucket": bucket_for(marker, heading_bucket),
                    "topic": topic,
                    "reason": "imported from triage markdown",
                    "model": "gpt-5.5 (triage 2026-07-29)",
                    "prompt_sha256": None,
                    "classified_at": "2026-07-29",
                }
            )
    run_date = "2026-07-29"
    target = runs_dir(repo) / run_date
    target.mkdir(exist_ok=True)
    body = "\n".join(json.dumps(row, ensure_ascii=False) for row in rows)
    (target / "run-zero-triage-import.jsonl").write_text(body + "\n")
    counts: dict[str, int] = {}
    for row in rows:
        counts[row["bucket"]] = counts.get(row["bucket"], 0) + 1
    print(f"imported {len(rows)} verdicts into {run_date}/run-zero-triage-import.jsonl")
    for bucket, count in sorted(counts.items()):
        print(f"  {bucket}: {count}")
