"""Clip body: extracted from screen_pending.py."""

from pathlib import Path


def capture_screen_pending_clip_body(directory: Path) -> str:
    """The captured article text, without its frontmatter or title line."""
    text = (directory / "index.md").read_text(errors="ignore")
    if text.startswith("---"):
        end = text.find("\n---", 3)
        if end != -1:
            text = text[end + 4 :]
    return " ".join(text.split())
