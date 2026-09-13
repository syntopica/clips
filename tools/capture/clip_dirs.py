"""Clip dirs: extracted from url_index.py."""

from collections.abc import Iterator
from pathlib import Path


def clip_dirs(repo: Path) -> Iterator[Path]:
    """Every clip directory in the store, in sorted path order.

    A directory counts as a clip when it holds a `state.json`, which is the one
    file every lane writes.
    """
    for state in sorted((repo / "clips").rglob("state.json")):
        yield state.parent
