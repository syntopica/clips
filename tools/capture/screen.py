"""Screen: extracted from screen_pending.py."""

import hashlib
import json
import tempfile
import uuid
from collections.abc import Callable
from datetime import date
from pathlib import Path
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from tools.capture.already_screened import already_screened
    from tools.capture.build_prompt import build_prompt
    from tools.capture.pending_clips import pending_clips
    from tools.capture.url_index import connect, normalize
else:
    from already_screened import already_screened
    from build_prompt import build_prompt
    from pending_clips import pending_clips
    from url_index import connect, normalize

BULK_MODEL = "gemini-3.1-pro-high"

OUTPUT_SCHEMA = {
    "type": "object",
    "properties": {
        "verdicts": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "id": {"type": "string"},
                    "bucket": {"type": "string", "enum": ["ingest", "read-no-value"]},
                    "reason": {"type": "string"},
                },
                "required": ["id", "bucket", "reason"],
            },
        }
    },
    "required": ["verdicts"],
}


def screen(
    repo: Path,
    limit: int,
    batch_size: int,
    dry_run: bool,
    scope: str,
    *,
    get_run_agy: Callable[[], Callable[..., dict[str, Any] | None]],
) -> int:
    run_agy = get_run_agy()
    clips = [c for c in pending_clips(repo) if c["id"] not in already_screened(repo)]
    if limit:
        clips = clips[:limit]
    if not clips:
        print("nothing to screen")
        return 0
    print(f"screening {len(clips)} clips in batches of {batch_size}")

    # Not in the repo: several sessions share this checkout, and a stray
    # untracked file in its root is one `git add -A` away from being committed
    # by work that has nothing to do with this run.
    scratch = Path(tempfile.mkdtemp()) / "screen-schema.json"
    scratch.write_text(json.dumps(OUTPUT_SCHEMA))
    connection = connect(repo)
    run_id = uuid.uuid4().hex[:12]
    run_date = date.today().isoformat()
    target = repo / "classifications" / run_date
    target.mkdir(parents=True, exist_ok=True)
    out_path = target / f"screen-{run_id}.jsonl"

    kept = dropped = unanswered = 0
    with out_path.open("a", buffering=1) as out:
        for start in range(0, len(clips), batch_size):
            batch = clips[start : start + batch_size]
            prompt = build_prompt(batch, scope)
            if dry_run:
                print(prompt[:2000])
                print(f"\n[dry run] {len(batch)} clips in this batch; calling nothing")
                return 0
            answer = run_agy(prompt, scratch)
            verdicts = {v["id"]: v for v in (answer or {}).get("verdicts", [])}
            for clip in batch:
                verdict = verdicts.get(clip["id"])
                if verdict is None:
                    unanswered += 1
                    continue
                bucket = verdict["bucket"]
                kept += bucket == "ingest"
                dropped += bucket != "ingest"
                out.write(
                    json.dumps(
                        {
                            "capture_id": clip["id"],
                            "normalized_url": normalize(clip["url"]),
                            "title": clip["title"],
                            "bucket": bucket,
                            "topic": "screen",
                            "reason": verdict.get("reason", ""),
                            "model": BULK_MODEL,
                            "prompt_sha256": hashlib.sha256(prompt.encode()).hexdigest(),
                            "classified_at": run_date,
                        },
                        ensure_ascii=False,
                    )
                    + "\n"
                )
            print(
                f"  {min(start + batch_size, len(clips))}/{len(clips)}"
                f"  keep {kept}  drop {dropped}  unanswered {unanswered}",
                flush=True,
            )
    scratch.unlink(missing_ok=True)
    connection.close()
    print(f"wrote {out_path.relative_to(repo)}")
    print(f"keep {kept}, drop {dropped}, unanswered {unanswered}")
    return 0
