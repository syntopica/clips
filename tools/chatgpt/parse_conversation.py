"""Parse conversation: extracted from triage.py."""

import re
from pathlib import Path

Conversation = dict[str, str]

EXCERPT_CHARS = 2000

FRONTMATTER = re.compile(r"\A---\n(.*?)\n---\n", re.S)

FIELD = re.compile(r"^(\w+): (.*)$", re.M)


def parse_conversation(page: Path) -> Conversation:
    """One exported page reduced to the fields the triage prompt carries."""
    text = page.read_text(encoding="utf-8", errors="replace")
    meta: dict[str, str] = {}
    found = FRONTMATTER.match(text)
    body = text
    if found:
        meta = dict(FIELD.findall(found.group(1)))
        body = text[found.end() :]
    return {
        "file": page.name,
        "conversation_id": meta.get("conversation_id", ""),
        "title": meta.get("title", "").strip('"'),
        "date": meta.get("created", "")[:10],
        "messages": meta.get("messages", ""),
        "excerpt": body.strip()[:EXCERPT_CHARS],
    }
