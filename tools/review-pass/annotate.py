"""Annotate: extracted from map_to_clips.py."""

import re

from review_row import ReviewRow

POST_ID = re.compile(r"([0-9a-f]{8,14})$")


def annotate(rows: list[ReviewRow], wiki: set[str], directories: dict[str, str]) -> None:
    """Stamp each row with its post id, whether the wiki cites it, and its clip."""
    for row in rows:
        match = POST_ID.search(row["url"])
        row["post_id"] = match.group(1) if match else ""
        row["in_wiki"] = row["post_id"] in wiki
        row["clip_dir"] = directories.get(row["post_id"], "")
        row["bucket"] = row["clip_dir"].split("/")[1] if row["clip_dir"] else "uncaptured"
