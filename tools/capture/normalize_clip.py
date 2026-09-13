"""Normalize clip: extracted from normalize_thin_clip.py."""

import json
import sqlite3
from collections.abc import Callable
from pathlib import Path
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from tools.capture.build_metadata import build_metadata
    from tools.capture.clipped_at_milliseconds import clipped_at_milliseconds
    from tools.capture.duplicate_capture import duplicate_capture
    from tools.capture.index_capture import index_capture
    from tools.capture.new_clip_id import new_clip_id
    from tools.capture.read_thin_clip import read_thin_clip
    from tools.capture.write_trio import write_trio
else:
    from build_metadata import build_metadata
    from clipped_at_milliseconds import clipped_at_milliseconds
    from duplicate_capture import duplicate_capture
    from index_capture import index_capture
    from new_clip_id import new_clip_id
    from read_thin_clip import read_thin_clip
    from write_trio import write_trio


def normalize_clip(
    clip_dir: Path,
    repo: Path,
    connection: sqlite3.Connection,
    dry_run: bool,
    *,
    get_capture_article: Callable[[], Callable[..., dict[str, Any]]],
) -> str:
    """One thin clip, from malformed frontmatter to a version-1 trio."""
    capture_article = get_capture_article()
    thin = read_thin_clip(clip_dir)
    duplicate = duplicate_capture(connection, thin["url"])
    if duplicate is not None:
        capture_id, existing_dir = duplicate
        if dry_run:
            return f"  duplicate of {capture_id} ({existing_dir}) - no fetch"
        target = json.loads((repo / existing_dir / "metadata.json").read_text())
        metadata = build_metadata(
            thin,
            new_clip_id(clipped_at_milliseconds(thin["clipped_at"])),
            {
                "title": target["title"],
                "url": target["canonical_url"] or "",
                "author": target["author"],
                "body": "",
            },
            "",
        )
        metadata["duplicate_of"] = capture_id
        write_trio(clip_dir, metadata, "", "")
        return f"  normalised as a duplicate of {capture_id}, no index row added"

    if dry_run:
        return f"  no capture of this URL - would refetch {thin['url']}"
    captured = capture_article(thin["url"])
    metadata = build_metadata(
        thin,
        new_clip_id(clipped_at_milliseconds(thin["clipped_at"])),
        captured["article"],
        captured["html"],
    )
    write_trio(clip_dir, metadata, captured["article"]["body"], captured["html"])
    index_capture(connection, metadata, clip_dir, repo)
    return f"  refetched {metadata['word_count']} words as {metadata['clip_id']}"
