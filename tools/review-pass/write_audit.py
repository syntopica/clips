"""Render the second pass into a triage audit record.

Usage: write_audit.py <work-directory> <review-mapped.jsonl> <out.md>
                      <harvest-date> <audit-date>

Reads every verdict file the pass produced and refuses to write unless the ids
line up with the candidates exactly - a batch that silently dropped entries
would otherwise become a shortlist that looks complete.
"""

import sys
from pathlib import Path

sys.path[:0] = [str(Path(__file__).parent), str(Path(__file__).resolve().parents[2])]

from typing import TypedDict

from tools.bootstrap.engine_archive import engine_archive
from tools.bootstrap.engine_config import engine_config

__all__ = [
    "Counter",
    "Keep",
    "MappedRow",
    "Path",
    "TypedDict",
    "Verdict",
    "clip_id",
    "json",
    "main",
    "re",
    "sys",
]

import json
import re
from collections import Counter

CLIP_ID = re.compile(r'^clip_id:\s*"([^"]+)"', re.MULTILINE)


from audit_lines import audit_lines
from clip_id import clip_id
from keep import Keep
from mapped_row import MappedRow
from verdict import Verdict


def main(argv: list[str]) -> int:
    """Join the verdicts to their candidates and render the audit record."""
    work = Path(argv[1])
    mapped: list[MappedRow] = [
        json.loads(line) for line in Path(argv[2]).read_text().splitlines() if line
    ]
    out = Path(argv[3])
    harvest_date, audit_date = argv[4], argv[5]
    clips_root = engine_archive(engine_config())

    verdicts: dict[str, Verdict] = {}
    for produced in sorted((work / "out").glob("*.json")):
        for verdict in json.loads(produced.read_text())["verdicts"]:
            verdicts[verdict["id"]] = verdict

    candidates = {
        row["id"]: row for row in mapped if not row["in_wiki"] and row["bucket"] != "uncaptured"
    }
    if set(verdicts) != set(candidates):
        missing = sorted(set(candidates) - set(verdicts))
        invented = sorted(set(verdicts) - set(candidates))
        raise SystemExit(f"verdict ids do not match: missing={missing} invented={invented}")

    keeps: list[Keep] = [
        {
            "score": verdict["score"],
            "reason": verdict["reason"],
            "topic": candidates[row_id]["topic"],
            "title": candidates[row_id]["title"],
            "url": candidates[row_id]["url"],
            "clip_id": clip_id(candidates[row_id], clips_root),
        }
        for row_id, verdict in verdicts.items()
        if verdict["verdict"] == "keep"
    ]
    keeps.sort(key=lambda keep: (-keep["score"], keep["topic"], keep["title"].lower()))

    in_wiki = sum(1 for row in mapped if row["in_wiki"])
    uncaptured = [row for row in mapped if row["bucket"] == "uncaptured"]
    scores = Counter(verdict["score"] for verdict in verdicts.values())

    lines = audit_lines(
        mapped,
        uncaptured,
        keeps,
        len(verdicts),
        in_wiki,
        scores,
        harvest_date,
        audit_date,
    )
    out.write_text("\n".join(lines) + "\n")
    print(f"wrote {out}: {len(keeps)} keeps, {len(uncaptured)} never captured")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
