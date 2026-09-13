"""Extract the Review-bucket entries from a not-ingested triage record.

Usage: extract_review_entries.py <not-ingested.md> <out.jsonl>

The record groups entries by topic (`## <topic>`) and then by bucket
(`### Review ...`, `### Auto-rejected ...`, `### Deleted upstream ...`). Only the
Review sections are read: the rejected bucket has its own audit and the 410 Gone
bucket is not recoverable. An entry is a checkbox line whose note may wrap onto
following indented lines, so the note is accumulated until the next entry or the
next heading.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))


__all__ = ["Path", "extract", "json", "main", "re", "sys"]

import json
import re

TOPIC = re.compile(r"^## (.+)$")
BUCKET = re.compile(r"^### (.+)$")
ENTRY = re.compile(r"^- \[ \] \[(.*)\]\((\S+)\)\s*(?:-\s*(.*))?$")


from extract import extract


def main(argv: list[str]) -> int:
    """Write the extracted Review entries as jsonl and report how many there were."""
    rows = extract(Path(argv[1]))
    Path(argv[2]).write_text("\n".join(json.dumps(row, ensure_ascii=False) for row in rows) + "\n")
    print(f"extracted {len(rows)}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
