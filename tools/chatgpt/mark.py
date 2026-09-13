#!/usr/bin/env python3
"""Update the mining status of ChatGPT index records in place.

Rewrites `sources/chatgpt/index.jsonl`, setting `status` (and `route`, when
given) on the named files. Statuses follow `personal/chatgpt-corpus.md`:
triaged, routed, discarded. `route` names where the findings went — a wiki
page path, or a repo path for an extracted document.

Usage:  mark.py <sources/chatgpt> <status> [--route PATH] file... [-]
        (`-` reads additional filenames from stdin, one per line)
"""

import argparse
import json
import sys
from pathlib import Path


def main() -> int:
    """Set the status (and optionally the route) of the named index records."""
    parser = argparse.ArgumentParser()
    parser.add_argument("source_dir", type=Path)
    parser.add_argument("status", choices=["triaged", "routed", "discarded"])
    parser.add_argument("--route", default="")
    parser.add_argument("files", nargs="+")
    args = parser.parse_args()

    names: set[str] = set()
    for name in args.files:
        if name == "-":
            names.update(line.strip() for line in sys.stdin if line.strip())
        else:
            names.add(name)

    index_path = args.source_dir / "index.jsonl"
    records = [
        json.loads(line)
        for line in index_path.read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]
    known = {record["file"] for record in records}
    missing = names - known
    if missing:
        print(f"not in index: {', '.join(sorted(missing))}", file=sys.stderr)
        return 1

    changed = 0
    for record in records:
        if record["file"] in names:
            record["status"] = args.status
            if args.route:
                record["route"] = args.route
            changed += 1

    index_path.write_text(
        "".join(json.dumps(record, ensure_ascii=False) + "\n" for record in records),
        encoding="utf-8",
    )
    print(f"{changed} records -> {args.status}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
