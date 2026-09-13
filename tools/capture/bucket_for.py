"""Bucket for: extracted from classifications.py."""

BUCKET_MARKERS = {
    "[ingested]": "ingest",
    "[gone-410]": "unavailable",
    "[x]": "ingest",
    "[ ]": "review",
}


def bucket_for(marker: str, heading_bucket: str) -> str:
    """A line's own marker wins; the section heading is the fallback."""
    return BUCKET_MARKERS.get(marker, heading_bucket)
