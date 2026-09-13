"""Sha256 hex: extracted from normalize_thin_clip.py."""

import hashlib


def sha256_hex(value: str) -> str:
    """The sha256 of a string's UTF-8 bytes, hex encoded."""
    return hashlib.sha256(value.encode("utf-8")).hexdigest()
