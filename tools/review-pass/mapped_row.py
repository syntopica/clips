"""Mappedrow: extracted from write_audit.py."""

from typing import TypedDict


class MappedRow(TypedDict):
    """One row of `review-mapped.jsonl`, as `map_to_clips.py` left it."""

    id: str
    topic: str
    title: str
    url: str
    in_wiki: bool
    clip_dir: str
    bucket: str
