"""Turn a full-text reading pass into a classification run, drops included.

The first sweep recorded only what it kept. That is the same asymmetry the
capture redesign exists to remove: a decision you cannot inspect later is a
decision you have to make again. In a discovery phase it is worse than useless,
because the interesting question is not "what did we take" but "what did we
pass on, and was that right".

Batch membership is reconstructible without a manifest because `read_batch.py`
selects deterministically - bucket, then `ORDER BY normalized_url`, then
offset/count - so the dropped set is the batch minus the kept set. This writes
both into a dated classification run, where every other verdict already lives.

    kept    -> bucket "ingest",  reason from the findings file
    dropped -> bucket "read-no-value", reason from the reasons file if one
               exists, otherwise recorded as unexplained so the gap is visible
               rather than silent.

Usage:
    record_reading.py <source-bucket> <total> <findings-dir> <run-name>
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tools.capture.default_capture_archive import default_capture_archive
    from tools.capture.drops_from import drops_from
    from tools.capture.kept_from import kept_from
    from tools.capture.read_batch import select
    from tools.capture.url_index import normalize
else:
    from default_capture_archive import default_capture_archive
    from drops_from import drops_from
    from kept_from import kept_from
    from read_batch import select
    from url_index import normalize

__all__ = [
    "Path",
    "default_capture_archive",
    "drops_from",
    "json",
    "kept_from",
    "main",
    "normalize",
    "re",
    "select",
    "sys",
]

import json
import re

BATCH_SIZE = 45
# source bucket, total, findings directory and run name - the usage line's four.
OPERAND_COUNT = 4
HEADING = re.compile(r"^###\s+(https?://\S+)", re.MULTILINE)
REASON_LINE = re.compile(r"^-\s+(?:What is worth keeping|Why):\s*(.+)$", re.MULTILINE)
DROP_LINE = re.compile(r"^-\s+(https?://\S+)\s*[-—:]\s*(.+)$", re.MULTILINE)


def main() -> int:
    """Turn a reading pass's findings files into one classification run, drops included."""
    if len(sys.argv[1:]) != OPERAND_COUNT:
        print(__doc__)
        return 2
    bucket, total, findings_dir, run_name = (
        sys.argv[1],
        int(sys.argv[2]),
        Path(sys.argv[3]),
        sys.argv[4],
    )
    repo = default_capture_archive()
    rows = []
    unexplained = 0
    for offset in range(0, total, BATCH_SIZE):
        index = offset // BATCH_SIZE + 1
        findings = findings_dir / f"{bucket}-b{index}-findings.md"
        if not findings.exists():
            continue
        kept = kept_from(findings)
        dropped_reasons = drops_from(findings_dir / f"{bucket}-b{index}-dropped.md")
        for url, _clip_dir in select(repo, bucket, offset, BATCH_SIZE):
            if url in kept:
                rows.append(
                    {
                        "normalized_url": url,
                        "bucket": "ingest",
                        "topic": bucket,
                        "reason": kept[url],
                        "model": "gpt-5.5 high, full text",
                        "classified_at": run_name,
                    }
                )
            else:
                reason = dropped_reasons.get(url)
                if reason is None:
                    unexplained += 1
                rows.append(
                    {
                        "normalized_url": url,
                        "bucket": "read-no-value",
                        "topic": bucket,
                        "reason": reason or "read in full, nothing kept (reason not recorded)",
                        "model": "gpt-5.5 high, full text",
                        "classified_at": run_name,
                    }
                )
    target = repo / "classifications" / run_name
    target.mkdir(parents=True, exist_ok=True)
    body = "\n".join(json.dumps(row, ensure_ascii=False) for row in rows)
    (target / f"full-text-read-{bucket}.jsonl").write_text(body + "\n")
    kept_count = sum(1 for row in rows if row["bucket"] == "ingest")
    print(f"{len(rows)} verdicts: {kept_count} kept, {len(rows) - kept_count} dropped")
    if unexplained:
        print(f"  {unexplained} drops carry no recorded reason (pre-fix batches)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
