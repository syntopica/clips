"""Keep: extracted from write_audit.py."""

from typing import TypedDict


class Keep(TypedDict):
    """A kept entry, joined to the candidate it judged, ready to render."""

    score: int
    reason: str
    topic: str
    title: str
    url: str
    clip_id: str
