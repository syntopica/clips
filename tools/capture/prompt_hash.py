"""Prompt hash: extracted from classifications.py."""

import hashlib


def prompt_hash(prompt: str) -> str:
    """The identity of a prompt, so a run records what produced it."""
    return hashlib.sha256(prompt.encode()).hexdigest()
