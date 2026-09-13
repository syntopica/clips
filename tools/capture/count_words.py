"""Count words: extracted from normalize_thin_clip.py."""


def count_words(body: str) -> int:
    """Whitespace-separated tokens, which is what `word_count` means everywhere here."""
    return len(body.split())
