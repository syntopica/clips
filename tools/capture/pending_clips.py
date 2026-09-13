"""Pending clips: extracted from screen_pending.py."""

import json
from pathlib import Path
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from tools.capture.capture_screen_pending_clip_body import (
        capture_screen_pending_clip_body as clip_body,
    )
else:
    from capture_screen_pending_clip_body import capture_screen_pending_clip_body as clip_body

EXCERPT_CHARS = 1400


def pending_clips(repo: Path) -> list[dict[str, Any]]:
    """Every clip under `clips/pending/`, oldest first, with its excerpt."""
    clips = []
    for metadata_path in sorted(repo.glob("clips/pending/**/metadata.json")):
        metadata = json.loads(metadata_path.read_text())
        directory = metadata_path.parent
        clips.append(
            {
                "id": metadata["clip_id"],
                "title": metadata.get("title", ""),
                "site": metadata.get("site", ""),
                "url": metadata.get("normalized_url") or metadata.get("url", ""),
                "excerpt": clip_body(directory)[:EXCERPT_CHARS],
            }
        )
    return clips
