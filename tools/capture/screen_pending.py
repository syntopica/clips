"""Screen pending clips against this wiki's scope, in bulk, before a person reads them.

Stage 2 of the capture-first design, applied to the backlog rather than to the
harvest. `classifications.py` records what a model thought of a capture from its
title; this reads the captured **text** and answers one narrower question: would
ingesting it teach this wiki anything it is for?

The reason it exists is measured. Of twelve clips reviewed by hand at the ingest
gate on 2026-09-11, five were rejected - a retirement-visa listicle, a page about
PS1 horror art direction, an April Fools joke about "Go 2.0", generic career
advice, and a gender-politics essay landing on the copywriting page. Each one
cost a full synthesis run on a paid transport plus a human reading a diff. There
are ~735 candidates behind them, so the review queue, not the transport, is the
bottleneck now.

Output is an ordinary classification run, so nothing downstream changes:

    classifications/<yyyy-mm-dd>/screen-<run-id>.jsonl
      {"capture_id", "normalized_url", "title", "bucket", "topic", "reason",
       "model", "prompt_sha256", "classified_at"}

`bucket` is `ingest` to keep or `read-no-value` to drop, the two values the
2026-07-30 full-text run already used.

**This does not gate the ingest, and cannot.** `demotedVerdictForClip` skips a
non-ingest verdict, but it exempts anything the owner ticked, and 727 of the 738
pending clips carry `clipped_from: clips-harvest`, which is exactly what
`isOwnerTickedCapture` reads as a tick. So every verdict written here is
invisible to that gate by design: SCHEMA puts the owner's own judgement above
every model's, never by recency, and a screen of the text must not quietly
overrule a tick made on the title.

What the run file is for is **choosing what to queue**. Ingest the kept ids and
leave the rest for later; nothing is rejected, and a clip the owner ticked is
still there whenever anyone disagrees with this run:

    python3 - <<'IDS'
    import json, glob
    for path in glob.glob("classifications/*/screen-*.jsonl"):
        for line in open(path):
            row = json.loads(line)
            if row["bucket"] == "ingest":
                print(row["capture_id"])
    IDS

It is a **screen, not a judge**: the drop bucket means "not worth a synthesis
run next", the run file records the reason and the model, and a later run can
disagree with this one without deleting it.

Routing follows the two-tier rule in `CLAUDE.md`: this reads a whole corpus, so
it runs on the bulk model through `agy`, never on codex and never inline. The
clip text is untrusted captured web content, so the pass is read-only -
`--sandbox --mode plan`, no permission skipping - and a tool request from an
injected payload blocks rather than being honoured.

Usage:
    screen_pending.py            screen every unscreened pending clip
    screen_pending.py --limit 40 stop after N clips (a cheap first taste)
    screen_pending.py --batch 12 clips per model call (default 12)
    screen_pending.py --dry-run  build the batches and print one prompt, call nothing
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

import hashlib
import json
import subprocess
import tempfile
import uuid
from datetime import date
from functools import partial
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tools.capture.already_screened import already_screened
    from tools.capture.build_prompt import build_prompt
    from tools.capture.capture_screen_pending_clip_body import (
        capture_screen_pending_clip_body as clip_body,
    )
    from tools.capture.capture_screen_pending_run_agy import (
        capture_screen_pending_run_agy as run_agy,
    )
    from tools.capture.pending_clips import pending_clips
    from tools.capture.screen import screen as _screen
    from tools.capture.unwrap import unwrap
    from tools.capture.url_index import connect, normalize
else:
    from already_screened import already_screened
    from build_prompt import build_prompt
    from capture_screen_pending_clip_body import capture_screen_pending_clip_body as clip_body
    from capture_screen_pending_run_agy import capture_screen_pending_run_agy as run_agy
    from pending_clips import pending_clips
    from screen import screen as _screen
    from unwrap import unwrap
    from url_index import connect, normalize

__all__ = [
    "Path",
    "already_screened",
    "argparse",
    "build_prompt",
    "clip_body",
    "connect",
    "date",
    "hashlib",
    "json",
    "main",
    "normalize",
    "pending_clips",
    "run_agy",
    "screen",
    "subprocess",
    "sys",
    "tempfile",
    "unwrap",
    "uuid",
]

import argparse

from tools.bootstrap.engine_archive import engine_archive
from tools.bootstrap.engine_config import engine_config

BULK_MODEL = "gemini-3.1-pro-high"
# Enough to judge what an article is about and whether it carries anything
# specific. Beyond this the model is re-reading a preamble, and the whole point
# of the screen is that it stays cheap.
EXCERPT_CHARS = 1400
PRINT_TIMEOUT = "20m"
CALL_TIMEOUT_SECONDS = 25 * 60

screen = partial(_screen, get_run_agy=partial(globals().__getitem__, "run_agy"))


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo", type=Path)
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--batch", type=int, default=12)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    config = engine_config()
    repo = args.repo if args.repo is not None else engine_archive(config)
    return screen(repo, args.limit, args.batch, args.dry_run, config.screening_scope)


if __name__ == "__main__":
    raise SystemExit(main())
