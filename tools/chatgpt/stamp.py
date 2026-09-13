"""Stamp: extracted from convert.py."""

from datetime import UTC, datetime


def stamp(value: str | float | None) -> str:
    """A ChatGPT epoch timestamp as an ISO-8601 UTC string, empty when absent."""
    if not value:
        return ""
    return datetime.fromtimestamp(float(value), tz=UTC).isoformat()
