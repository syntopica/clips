"""Candidate: extracted from build_batches.py."""

from typing import NotRequired, TypedDict


class Candidate(TypedDict):
    """One mapped Review entry, as `map_to_clips.py` writes it to jsonl.

    `body` is absent until `select_candidates` reads the clip, which is why it
    is the one optional key: a row that never reached a clip never gains it.
    """

    id: str
    title: str
    topic: str
    in_wiki: bool
    clip_dir: str
    bucket: str
    body: NotRequired[str]
