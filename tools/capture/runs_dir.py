"""Runs dir: extracted from classifications.py."""

from pathlib import Path

RUNS_DIRNAME = "classifications"


def runs_dir(repo: Path) -> Path:
    """The `classifications/` directory, created on first use."""
    path = repo / RUNS_DIRNAME
    path.mkdir(exist_ok=True)
    return path
