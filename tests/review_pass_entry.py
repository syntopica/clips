"""Review pass: entry."""


def _entry(row_id: str, url: str, **overrides) -> dict:
    row = {"id": row_id, "topic": "ai", "title": f"title {row_id}", "url": url, "note": ""}
    row.update(overrides)
    return row
