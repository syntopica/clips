"""Review pass: judged."""


def _judged(row_id: str, **overrides) -> dict:
    row = {
        "id": row_id,
        "topic": "ai",
        "title": f"title {row_id}",
        "url": f"https://medium.com/@a/{row_id}",
        "in_wiki": False,
        "bucket": "pending",
        "clip_dir": f"clips/pending/{row_id}",
    }
    row.update(overrides)
    return row
