"""Normalized url: extracted from normalize_thin_clip.py."""

from urllib.parse import urlsplit


def normalized_url(url: str) -> str:
    """`normalizeArticleUrl`'s answer, not `url_index.normalize`'s.

    The two differ deliberately and both are right for their own job: the index
    lowercases everything because it only ever compares, while `normalized_url`
    in metadata keeps the path's case, because `medium.com/@UdaykiranEstari/...`
    is what every other clip in the store records.
    """
    parts = urlsplit(url.strip())
    path = parts.path[:-1] if parts.path.endswith("/") else parts.path
    return f"{parts.scheme}://{parts.netloc.lower()}{path}"
