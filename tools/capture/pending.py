"""Pending: extracted from backfill_assets.py."""

from collections.abc import Iterator
from pathlib import Path


def pending(repo: Path) -> Iterator[Path]:
    """Every clip directory that has no `assets.json`, so no backfill has run on it."""
    for state in sorted((repo / "clips").rglob("state.json")):
        clip_dir = state.parent
        if not (clip_dir / "assets.json").exists():
            yield clip_dir
