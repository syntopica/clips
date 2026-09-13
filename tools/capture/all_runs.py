"""All runs: extracted from classifications.py."""

from pathlib import Path
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tools.capture.runs_dir import runs_dir
else:
    from runs_dir import runs_dir


def all_runs(repo: Path) -> list[Path]:
    """Every run file, sorted by run date then name, so later runs read last."""
    return sorted(runs_dir(repo).glob("*/*.jsonl"))
