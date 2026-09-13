"""Classification verdicts, stored outside the captures they describe.

Stage 2 of the capture-first design. A verdict is an opinion about a capture,
formed by one model with one prompt at one moment - so it belongs beside the
capture, not inside it. Writing verdicts into the captured directory would mean
reclassifying rewrites the artifact, which breaks the immutability the whole
design rests on.

    classifications/<yyyy-mm-dd>/<run-id>.jsonl
      {"capture_id", "normalized_url", "bucket", "topic", "reason",
       "model", "prompt_sha256", "classified_at"}

Append-only, one file per run. A better model or a corrected prompt produces a
new run alongside the old one, so the two can be compared - which is exactly
what the 2026-07-30 calibration audit needed and had to reconstruct by hand.
Recording `model` and `prompt_sha256` makes that audit a query.

`latest` resolves the current verdict per capture by run date, so the synthesis
stage reads one view without caring how many runs exist.

Usage:
    classifications.py import-triage <triage-dir>   seed run zero from triage files
    classifications.py latest [--bucket ingest]
    classifications.py runs
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

import hashlib
import json
import sqlite3
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from tools.capture.all_runs import all_runs
    from tools.capture.bucket_for import bucket_for
    from tools.capture.default_capture_archive import default_capture_archive
    from tools.capture.import_triage import import_triage
    from tools.capture.latest import latest
    from tools.capture.lookup_capture import lookup_capture
    from tools.capture.prompt_hash import prompt_hash
    from tools.capture.runs import runs
    from tools.capture.runs_dir import runs_dir
    from tools.capture.url_index import connect, normalize
else:
    from all_runs import all_runs
    from bucket_for import bucket_for
    from default_capture_archive import default_capture_archive
    from import_triage import import_triage
    from latest import latest
    from lookup_capture import lookup_capture
    from prompt_hash import prompt_hash
    from runs import runs
    from runs_dir import runs_dir
    from url_index import connect, normalize

__all__ = [
    "Any",
    "Path",
    "all_runs",
    "bucket_for",
    "connect",
    "default_capture_archive",
    "hashlib",
    "import_triage",
    "json",
    "latest",
    "lookup_capture",
    "main",
    "normalize",
    "prompt_hash",
    "re",
    "runs",
    "runs_dir",
    "sqlite3",
    "sys",
]

import re

RUNS_DIRNAME = "classifications"
BUCKET_MARKERS = {
    "[ingested]": "ingest",
    "[gone-410]": "unavailable",
    "[x]": "ingest",
    "[ ]": "review",
}
# Two line shapes exist in the triage output, and missing the second silently
# dropped all 327 rejected entries on the first import run:
#   - [x] [Title](url) - reason      a bucketed line, marker first
#   - [Title](url) - reason          an unmarked line, used in Ingest/Rejected
ENTRY = re.compile(r"^\s*-\s+(?:(\[[^\]]*\])\s+)?\[([^\]]*)\]\((https?://[^\s)]+)\)")


def main() -> int:
    """Dispatch `import-triage`, `latest` or `runs`; anything else prints the usage."""
    args = sys.argv[1:]
    if not args:
        print(__doc__)
        return 2
    repo = default_capture_archive()
    if args[0] == "import-triage":
        triage = (
            Path(args[1])
            if len(args) > 1
            else (Path.home() / "p" / "brain" / "inbox" / "newsletter-triage")
        )
        import_triage(repo, triage)
    elif args[0] == "latest":
        bucket = args[args.index("--bucket") + 1] if "--bucket" in args else None
        latest(repo, bucket)
    elif args[0] == "runs":
        runs(repo)
    else:
        print(__doc__)
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
