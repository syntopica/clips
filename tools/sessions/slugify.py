"""Slugify: extracted from convert.py."""

import re


def slugify(text: str) -> str:
    """Six words of `text` as a filename-safe slug, or "session" when empty."""
    words = re.sub(r"[^\w\s-]", "", text.lower()).split()[:6]
    slug = "-".join(words)[:60].strip("-")
    return slug or "session"
