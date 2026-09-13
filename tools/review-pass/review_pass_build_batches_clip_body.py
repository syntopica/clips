"""Clip body: extracted from build_batches.py."""

from pathlib import Path

BODY_CHARS = 1600


def review_pass_build_batches_clip_body(index: Path) -> str:
    """Return the clip's prose, without its frontmatter, as one line."""
    text = index.read_text()
    body = text.split("---", 2)[-1].strip() if text.startswith("---") else text
    return " ".join(body.split())[:BODY_CHARS]
