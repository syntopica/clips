"""Read thin clip: extracted from normalize_thin_clip.py."""

from pathlib import Path
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from tools.capture.frontmatter_block import frontmatter_block
    from tools.capture.frontmatter_fields import frontmatter_fields
    from tools.capture.parse_tags import parse_tags
    from tools.capture.recover_url import recover_url
else:
    from frontmatter_block import frontmatter_block
    from frontmatter_fields import frontmatter_fields
    from parse_tags import parse_tags
    from recover_url import recover_url

CLIP_SOURCE = "ios-shortcut"


def read_thin_clip(clip_dir: Path) -> dict[str, Any]:
    """The fields a version-1 trio needs, recovered from a thin `index.md`."""
    fields = frontmatter_fields(frontmatter_block((clip_dir / "index.md").read_text(), clip_dir))
    return {
        "url": recover_url(fields.get("url", ""), clip_dir),
        "clipped_at": fields.get("clipped_at", ""),
        "capture_source": fields.get("capture_source", CLIP_SOURCE),
        "note": fields.get("note", ""),
        "tags": parse_tags(fields.get("tags", "")),
    }
