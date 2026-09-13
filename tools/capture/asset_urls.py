"""Asset urls: extracted from backfill_assets.py."""

import html as html_module
import re
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tools.capture.largest_srcset_candidate import largest_srcset_candidate
else:
    from largest_srcset_candidate import largest_srcset_candidate

IMG_TAG = re.compile(r"<img\b[^>]*>", re.IGNORECASE)

SRC_ATTR = re.compile(r'\bsrc="([^"]+)"', re.IGNORECASE)

SRCSET_ATTR = re.compile(r'\bsrcset="([^"]+)"', re.IGNORECASE)


def asset_urls(html: str) -> list[str]:
    """Every distinct remote asset a page's image tags point at, srcset preferred."""
    found: list[str] = []
    for tag in IMG_TAG.findall(html):
        srcset = SRCSET_ATTR.search(tag)
        chosen = largest_srcset_candidate(srcset.group(1)) if srcset else None
        if not chosen:
            src = SRC_ATTR.search(tag)
            chosen = src.group(1) if src else None
        if chosen:
            # Attribute values are HTML-escaped, so a URL with query parameters
            # arrives as `a&amp;b`. Fetching that reaches a different resource
            # or none at all; the CDN tolerating it is luck, not correctness.
            chosen = html_module.unescape(chosen)
        if chosen and chosen.startswith("http") and chosen not in found:
            found.append(chosen)
    return found
