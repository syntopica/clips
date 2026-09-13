"""Candidates: extracted from check_remote_drift.py."""

from pathlib import Path
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from tools.capture.is_medium import is_medium
    from tools.capture.url_index import clip_dirs, read_metadata
else:
    from is_medium import is_medium
    from url_index import clip_dirs, read_metadata


def candidates(
    repo: Path, clip_filter: str | None, limit: int, skip: set[str]
) -> list[tuple[Path, dict[str, Any]]]:
    """The clips this run will check, newest capture first.

    Never the whole store by default: 1485 captures is 1485 requests at one
    publisher, and the point of the selection is that a check costs a real fetch
    and a real extraction.
    """
    found: list[tuple[Path, dict[str, Any]]] = []
    for clip_dir in clip_dirs(repo):
        metadata = read_metadata(clip_dir)
        url = metadata.get("url")
        if not url or not metadata.get("content_sha256"):
            continue
        if not is_medium(url):
            continue
        if clip_filter and clip_filter not in metadata.get("clip_id", ""):
            continue
        if metadata.get("clip_id") in skip:
            continue
        found.append((clip_dir, metadata))
    found.sort(key=lambda pair: pair[1].get("clipped_at", ""), reverse=True)
    return found[:limit]
