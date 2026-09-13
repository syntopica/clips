"""Clipped at milliseconds: extracted from normalize_thin_clip.py."""


def clipped_at_milliseconds(clipped_at: str) -> int:
    """The capture's own timestamp as epoch milliseconds.

    Used for the ULID's clock half, so the id sorts where the capture happened
    rather than where the backfill ran.
    """
    from datetime import datetime

    return int(datetime.fromisoformat(clipped_at).timestamp() * 1000)
