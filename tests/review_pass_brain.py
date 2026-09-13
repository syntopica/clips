"""Review pass: brain."""

from pathlib import Path


def _brain(root: Path, files: dict[str, str]) -> Path:
    for name, text in files.items():
        path = root / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text)
    for required in ("index.md", "log.md"):
        (root / required).touch(exist_ok=True)
    return root
