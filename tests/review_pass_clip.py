"""Review pass: clip."""

from pathlib import Path


def _clip(clips: Path, directory: str, text: str) -> None:
    index = clips / directory / "index.md"
    index.parent.mkdir(parents=True, exist_ok=True)
    index.write_text(text)
