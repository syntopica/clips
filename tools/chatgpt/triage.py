#!/usr/bin/env python3
"""Bulk triage of the exported ChatGPT conversations into an index.

Reads every conversation under `sources/chatgpt/*.md`, classifies each one
through agy on the bulk model (topics, owning project, value tier, one-line
summary), and appends one JSON record per conversation to
`sources/chatgpt/index.jsonl`. The index is the resume state: a conversation
whose filename already appears there is skipped, so an interrupted sweep
continues where it stopped.

Each agy call carries one batch of conversations inline (title, date, message
count, and a head excerpt) — classification needs no tools, so the run is
narrowed to `--sandbox --mode plan` with no permission skip, per the model
routing rule in CLAUDE.md. The `--json-schema` flag enforces the output shape;
a batch whose answer does not cover exactly its input files is retried once
and then left untriaged for the next run.

Usage:  triage.py <sources/chatgpt> [--batch-size N] [--workers N] [--limit N]
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

import subprocess
from functools import partial
from typing import TYPE_CHECKING

__all__ = [
    "UTC",
    "Any",
    "Path",
    "ThreadPoolExecutor",
    "argparse",
    "batch_prompt",
    "datetime",
    "json",
    "known_projects",
    "main",
    "parse_conversation",
    "re",
    "run_agy",
    "subprocess",
    "sys",
    "tempfile",
    "threading",
    "triage_batch",
    "unwrap_agy_response",
    "validate_items",
]


if TYPE_CHECKING:
    from tools.chatgpt.batch_prompt import batch_prompt
    from tools.chatgpt.chatgpt_triage_run_agy import chatgpt_triage_run_agy as run_agy
    from tools.chatgpt.chatgpt_triage_unwrap_agy_response import (
        chatgpt_triage_unwrap_agy_response as unwrap_agy_response,
    )
    from tools.chatgpt.chatgpt_triage_validate_items import (
        chatgpt_triage_validate_items as validate_items,
    )
    from tools.chatgpt.known_projects import known_projects
    from tools.chatgpt.parse_conversation import parse_conversation
    from tools.chatgpt.triage_batch import triage_batch as _triage_batch
    from tools.chatgpt.triage_output_schema import triage_output_schema
else:
    from batch_prompt import batch_prompt
    from chatgpt_triage_run_agy import chatgpt_triage_run_agy as run_agy
    from chatgpt_triage_unwrap_agy_response import (
        chatgpt_triage_unwrap_agy_response as unwrap_agy_response,
    )
    from chatgpt_triage_validate_items import chatgpt_triage_validate_items as validate_items
    from known_projects import known_projects
    from parse_conversation import parse_conversation
    from triage_batch import triage_batch as _triage_batch
    from triage_output_schema import triage_output_schema

triage_batch = partial(_triage_batch, get_run_agy=partial(globals().__getitem__, "run_agy"))

# This directory holds `queue.py`, which shadows the stdlib `queue` module that
# concurrent.futures imports; drop the script dir from the path before that.
sys.path = [
    entry for entry in sys.path if Path(entry or ".").resolve() != Path(__file__).parent.resolve()
]

import argparse
import json
import re
import tempfile
import threading
from concurrent.futures import ThreadPoolExecutor
from datetime import UTC, datetime
from typing import Any

# agy's answers are JSON the model produced against a schema: the shape is
# checked in `validate_items` rather than promised by the annotation.
JsonDict = dict[str, Any]
# A parsed conversation page: every field is the frontmatter text or an
# excerpt of the body, so all of them are strings.
Conversation = dict[str, str]

AGY_BULK_MODEL = "gemini-3.1-pro-high"
EXCERPT_CHARS = 2000
VALUES = {"high", "medium", "low", "discard"}

FRONTMATTER = re.compile(r"\A---\n(.*?)\n---\n", re.S)
FIELD = re.compile(r"^(\w+): (.*)$", re.M)

OUTPUT_SCHEMA = triage_output_schema()


def main() -> int:
    """Triage every page not yet in the index, appending records as they land."""
    parser = argparse.ArgumentParser()
    parser.add_argument("source_dir", type=Path)
    parser.add_argument("--batch-size", type=int, default=20)
    parser.add_argument("--workers", type=int, default=3)
    parser.add_argument("--limit", type=int, default=0, help="cap batches, 0 = all")
    args = parser.parse_args()

    index_path = args.source_dir / "index.jsonl"
    done: set[str] = set()
    if index_path.exists():
        for line in index_path.read_text(encoding="utf-8").splitlines():
            if line.strip():
                done.add(json.loads(line)["file"])

    pages = sorted(page for page in args.source_dir.glob("*.md") if page.name not in done)
    print(f"{len(pages)} to triage, {len(done)} already in index", file=sys.stderr)
    if not pages:
        return 0

    projects = known_projects(args.source_dir)
    conversations = [parse_conversation(page) for page in pages]
    batches = [
        conversations[i : i + args.batch_size]
        for i in range(0, len(conversations), args.batch_size)
    ]
    if args.limit:
        batches = batches[: args.limit]

    with tempfile.NamedTemporaryFile(
        "w", suffix=".json", delete=False, prefix="chatgpt-triage-schema-"
    ) as schema_file:
        json.dump(OUTPUT_SCHEMA, schema_file)

    write_lock = threading.Lock()
    total = len(conversations) + len(done)
    failed = 0

    def work(batch: list[Conversation]) -> None:
        nonlocal failed
        items = triage_batch(batch, projects, schema_file.name)
        if items is None:
            with write_lock:
                failed += 1
                names = ", ".join(c["file"] for c in batch[:3])
                print(f"batch failed, left untriaged: {names}...", file=sys.stderr)
            return
        now = datetime.now(UTC).isoformat(timespec="seconds")
        records: list[JsonDict] = []
        for conversation, item in zip(batch, items, strict=False):
            records.append(
                {
                    "file": conversation["file"],
                    "conversation_id": conversation["conversation_id"],
                    "date": conversation["date"],
                    "title": conversation["title"],
                    "topics": item["topics"],
                    "project": item["project"],
                    "value": item["value"],
                    "summary": item["summary"],
                    "status": "triaged",
                    "triaged_at": now,
                }
            )
        with write_lock:
            with index_path.open("a", encoding="utf-8") as index:
                for record in records:
                    index.write(json.dumps(record, ensure_ascii=False) + "\n")
            done.update(record["file"] for record in records)
            print(f"{len(done)}/{total} triaged", file=sys.stderr)

    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        list(pool.map(work, batches))

    print(f"done: {len(done)} in index, {failed} batches failed", file=sys.stderr)
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
