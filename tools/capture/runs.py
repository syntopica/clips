"""Runs: extracted from classifications.py."""

from pathlib import Path
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tools.capture.all_runs import all_runs
else:
    from all_runs import all_runs


def runs(repo: Path) -> None:
    """Print one line per run file with how many verdicts it holds."""
    for path in all_runs(repo):
        lines = sum(1 for line in path.read_text().splitlines() if line.strip())
        print(f"{path.parent.name}/{path.name}\t{lines} verdicts")
