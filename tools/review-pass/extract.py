"""Extract: extracted from extract_review_entries.py."""

import re
from pathlib import Path

TOPIC = re.compile(r"^## (.+)$")

BUCKET = re.compile(r"^### (.+)$")

ENTRY = re.compile(r"^- \[ \] \[(.*)\]\((\S+)\)\s*(?:-\s*(.*))?$")


def extract(source: Path) -> list[dict[str, str]]:
    """Return one row per Review checkbox line, its wrapped note folded in."""
    topic = "other"
    in_review = False
    rows: list[dict[str, str]] = []
    pending: dict[str, str] | None = None
    for line in source.read_text().splitlines():
        heading = TOPIC.match(line)
        if heading:
            topic, in_review, pending = heading.group(1).strip(), False, None
            continue
        bucket = BUCKET.match(line)
        if bucket:
            in_review = bucket.group(1).startswith("Review")
            pending = None
            continue
        if not in_review:
            continue
        entry = ENTRY.match(line)
        if entry:
            pending = {
                "id": f"r{len(rows) + 1:04d}",
                "topic": topic,
                "title": entry.group(1),
                "url": entry.group(2),
                "note": (entry.group(3) or "").strip(),
            }
            rows.append(pending)
            continue
        if pending is not None and line.startswith("      "):
            pending["note"] = f"{pending['note']} {line.strip()}".strip()
        else:
            pending = None
    return rows
