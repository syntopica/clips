"""Chatgpt tools: exported page."""

from pathlib import Path


def exported_page(directory: Path, name: str, conversation_id: str) -> None:
    """A rendered page carrying the frontmatter line the queues match on."""
    directory.mkdir(parents=True, exist_ok=True)
    (directory / name).write_text(
        f"---\ntitle: t\nconversation_id: {conversation_id}\n---\n\nbody\n", encoding="utf-8"
    )
