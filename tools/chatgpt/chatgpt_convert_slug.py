"""Slug: extracted from convert.py."""

import re


def chatgpt_convert_slug(title: str | None) -> str:
    """A filename-safe stem for a conversation title, capped at 60 characters."""
    cleaned = re.sub(r"[^a-z0-9]+", "-", (title or "untitled").lower())
    return cleaned.strip("-")[:60] or "untitled"
