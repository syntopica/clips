#!/usr/bin/env python3
"""Extract durable findings from a slice of the ChatGPT corpus.

Given conversation filenames (arguments, or one per line on stdin), reads each
page from `sources/chatgpt/`, sends batches through agy on the bulk model, and
prints one JSON object with the extracted findings per conversation. The
caller — a mining session working cluster by cluster, see
`personal/chatgpt-corpus.md` — folds the findings into wiki pages and updates
`index.jsonl`; this script only reads.

Same transport discipline as triage.py: content inline, `--sandbox --mode
plan`, no permission skip, schema-enforced output, a batch whose answer does
not cover exactly its input files is retried once.

Usage:  mine.py <sources/chatgpt> [file.md ...] [--batch-size N]
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

import subprocess
from typing import TYPE_CHECKING

__all__ = [
    "Any",
    "Path",
    "argparse",
    "conversation_block",
    "json",
    "main",
    "re",
    "run_agy",
    "subprocess",
    "sys",
    "tempfile",
    "unwrap_agy_response",
    "validate_items",
]


if TYPE_CHECKING:
    from tools.chatgpt.chatgpt_mine_run_agy import chatgpt_mine_run_agy as run_agy
    from tools.chatgpt.chatgpt_mine_unwrap_agy_response import (
        chatgpt_mine_unwrap_agy_response as unwrap_agy_response,
    )
    from tools.chatgpt.chatgpt_mine_validate_items import (
        chatgpt_mine_validate_items as validate_items,
    )
    from tools.chatgpt.conversation_block import conversation_block
else:
    from chatgpt_mine_run_agy import chatgpt_mine_run_agy as run_agy
    from chatgpt_mine_unwrap_agy_response import (
        chatgpt_mine_unwrap_agy_response as unwrap_agy_response,
    )
    from chatgpt_mine_validate_items import chatgpt_mine_validate_items as validate_items
    from conversation_block import conversation_block

# This directory holds `queue.py`, which shadows the stdlib `queue` module;
# keep the path clean before anything imports it.
sys.path = [
    entry for entry in sys.path if Path(entry or ".").resolve() != Path(__file__).parent.resolve()
]

import argparse
import json
import re
import tempfile
from typing import Any

# agy's answers are JSON the model produced against a schema: the shape is
# checked in `validate_items` rather than promised by the annotation.
JsonDict = dict[str, Any]

AGY_BULK_MODEL = "gemini-3.1-pro-high"
CONTENT_CHARS = 15000

FRONTMATTER = re.compile(r"\A---\n.*?\n---\n", re.S)

OUTPUT_SCHEMA = {
    "type": "object",
    "properties": {
        "items": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "file": {"type": "string"},
                    "keep": {"type": "boolean"},
                    "findings": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "summary": {"type": "string"},
                                "detail": {"type": "string"},
                            },
                            "required": ["summary", "detail"],
                        },
                    },
                },
                "required": ["file", "keep", "findings"],
            },
        }
    },
    "required": ["items"],
}

PROMPT_HEAD = """You are mining exported ChatGPT conversations for a personal
knowledge wiki about Cristian, a full-stack developer and business owner in
Spain. For EACH conversation below return one item:
- file: the filename, copied exactly, each input file exactly once.
- keep: false when nothing durable is in it (generic knowledge any model can
  regenerate, throwaway debugging), true otherwise.
- findings: for keep=true, one entry per durable piece of information. Extract
  ONLY what is specific to Cristian's life, work, projects, or decisions:
  decisions made and their reasons, concrete facts (amounts, dates, names,
  addresses, diagnoses, contract terms), project specs or ideas he described,
  hard-won technical gotchas tied to his infrastructure, personal or business
  context a future assistant would need. Do NOT extract textbook knowledge,
  the assistant's generic advice, or anything already obvious from the
  conversation title. summary: one short line. detail: the substance itself,
  self-contained, with the specific values — a reader must not need the
  conversation to use it. Write findings in English.

Conversations:"""


def main() -> int:
    """Mine every named conversation in batches and print the findings as JSON."""
    parser = argparse.ArgumentParser()
    parser.add_argument("source_dir", type=Path)
    parser.add_argument("files", nargs="*")
    parser.add_argument("--batch-size", type=int, default=8)
    args = parser.parse_args()

    names = args.files or [line.strip() for line in sys.stdin if line.strip()]
    if not names:
        print("no files given", file=sys.stderr)
        return 1

    with tempfile.NamedTemporaryFile(
        "w", suffix=".json", delete=False, prefix="chatgpt-mine-schema-"
    ) as schema_file:
        json.dump(OUTPUT_SCHEMA, schema_file)

    collected: list[JsonDict] = []
    failed: list[str] = []
    batches = [names[i : i + args.batch_size] for i in range(0, len(names), args.batch_size)]
    for batch in batches:
        prompt = PROMPT_HEAD + "".join(conversation_block(args.source_dir, name) for name in batch)
        items = None
        for _ in range(2):
            items = validate_items(run_agy(prompt, schema_file.name), batch)
            if items is not None:
                break
        if items is None:
            failed.extend(batch)
            print(f"batch failed: {batch[0]}...", file=sys.stderr)
            continue
        collected.extend(items)
        print(f"{len(collected)}/{len(names)} mined", file=sys.stderr)

    print(json.dumps({"items": collected, "failed": failed}, ensure_ascii=False, indent=1))
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
