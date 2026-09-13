"""Frontmatter block: extracted from normalize_thin_clip.py."""

from pathlib import Path
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tools.capture.thin_clip_error import ThinClipError
else:
    from thin_clip_error import ThinClipError


def frontmatter_block(text: str, clip_dir: Path) -> list[str]:
    """The lines between the opening and closing `---` fences."""
    lines = text.splitlines()
    if not lines or lines[0].strip() != "---":
        raise ThinClipError(f"{clip_dir}: index.md has no frontmatter fence")
    for index, line in enumerate(lines[1:], start=1):
        if line.strip() == "---":
            return lines[1:index]
    raise ThinClipError(f"{clip_dir}: index.md frontmatter is never closed")
