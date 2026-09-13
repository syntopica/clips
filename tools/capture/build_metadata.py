"""Build metadata: extracted from normalize_thin_clip.py."""

from typing import TYPE_CHECKING, Any
from urllib.parse import urlsplit

if TYPE_CHECKING:
    from tools.capture.count_words import count_words
    from tools.capture.normalized_url import normalized_url
    from tools.capture.sha256_hex import sha256_hex
else:
    from count_words import count_words
    from normalized_url import normalized_url
    from sha256_hex import sha256_hex

TOOL_VERSION = "0.1.0"


def build_metadata(
    thin: dict[str, Any], clip_id: str, article: dict[str, Any], html: str
) -> dict[str, Any]:
    """The version-1 metadata for a normalised clip.

    `sensitivity` is `private`, not `public`: the routing table is deterministic
    and a capture whose sensitivity was never declared is not evidence that it
    is public. `schema_version` stays 1 - the shape of a record, not the shape
    of a capture, which is keyed by `clipped_from`.
    """
    url = thin["url"]
    body = article["body"]
    return {
        "schema_version": 1,
        "clip_id": clip_id,
        "title": article["title"],
        "url": url,
        "normalized_url": normalized_url(url),
        "canonical_url": article["url"] or None,
        "site": urlsplit(url).netloc,
        "author": article["author"],
        "published": None,
        "language": None,
        "clipped_at": thin["clipped_at"],
        "clipped_from": thin["capture_source"],
        "extension_version": TOOL_VERSION,
        "extractor": "article",
        "site_extractor": True,
        "extractor_version": None,
        "snapshot_mode": "extracted" if html else "omitted",
        "sensitivity": "private",
        "content_sha256": sha256_hex(body),
        "source_html_sha256": sha256_hex(html),
        "asset_count": 0,
        "asset_failures": [],
        "note": thin["note"],
        "tags": thin["tags"],
        "word_count": count_words(body),
    }
