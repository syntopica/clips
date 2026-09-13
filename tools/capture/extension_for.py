"""Extension for: extracted from backfill_assets.py."""

import mimetypes
from pathlib import Path

MAX_EXTENSION_LENGTH = 5


def extension_for(url: str, content_type: str | None) -> str:
    """The file extension to store an asset under: the URL's, the Content-Type's, or `.bin`."""
    from_url = Path(url.split("?", maxsplit=1)[0]).suffix.lower()
    if from_url and len(from_url) <= MAX_EXTENSION_LENGTH:
        return from_url
    if content_type:
        guessed = mimetypes.guess_extension(content_type.split(";")[0].strip())
        if guessed:
            return guessed
    return ".bin"
