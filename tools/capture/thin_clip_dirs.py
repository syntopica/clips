"""Thin clip dirs: extracted from normalize_thin_clip.py."""

from pathlib import Path


def thin_clip_dirs(repo: Path) -> list[Path]:
    """Every clip directory holding an `index.md` and no `metadata.json`."""
    return sorted(
        path.parent
        for path in (repo / "clips").rglob("index.md")
        if not (path.parent / "metadata.json").exists()
    )
