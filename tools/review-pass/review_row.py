"""Reviewrow: extracted from map_to_clips.py."""

from typing import NotRequired, TypedDict


class ReviewRow(TypedDict):
    """One extracted Review entry, before and after `annotate` stamps it.

    The four clip fields are optional because they are exactly what this module
    adds: a row read from `extract_review_entries.py` carries only the first
    five.
    """

    id: str
    topic: str
    title: str
    url: str
    note: str
    post_id: NotRequired[str]
    in_wiki: NotRequired[bool]
    clip_dir: NotRequired[str]
    bucket: NotRequired[str]
