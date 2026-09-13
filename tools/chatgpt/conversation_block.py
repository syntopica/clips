"""Conversation block: extracted from mine.py."""

import re
from pathlib import Path

CONTENT_CHARS = 15000

FRONTMATTER = re.compile(r"\A---\n.*?\n---\n", re.S)


def conversation_block(source_dir: Path, name: str) -> str:
    """One conversation as a prompt block, frontmatter stripped and middle-elided."""
    text = (source_dir / name).read_text(encoding="utf-8", errors="replace")
    body = FRONTMATTER.sub("", text).strip()
    if len(body) > CONTENT_CHARS:
        half = CONTENT_CHARS // 2
        body = body[:half] + "\n[... middle truncated ...]\n" + body[-half:]
    return f"\n=== file: {name}\n{body}"
