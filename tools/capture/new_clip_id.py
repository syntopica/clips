"""New clip id: extracted from normalize_thin_clip.py."""

import secrets

CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"


def new_clip_id(milliseconds: int) -> str:
    """A ULID: 10 Crockford base32 characters of clock, then 16 of randomness."""
    timestamp = milliseconds
    characters: list[str] = []
    for _ in range(10):
        characters.insert(0, CROCKFORD[timestamp % 32])
        timestamp //= 32
    characters.extend(secrets.choice(CROCKFORD) for _ in range(16))
    return "".join(characters)
