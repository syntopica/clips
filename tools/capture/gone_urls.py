"""Gone urls: extracted from recover_gone.py."""

from collections.abc import Callable
from pathlib import Path


def gone_urls(*, get_triage_dir: Callable[[], Path]) -> list[str]:
    """Every URL marked `[gone-410]` across every triage run."""
    TRIAGE_DIR = get_triage_dir()
    found: list[str] = []
    for path in sorted(TRIAGE_DIR.rglob("*.md")):
        for line in path.read_text(errors="ignore").splitlines():
            if "[gone-410]" not in line:
                continue
            start = line.find("](http")
            if start == -1:
                continue
            url = line[start + 2 :].split(")")[0]
            if url not in found:
                found.append(url)
    return found
