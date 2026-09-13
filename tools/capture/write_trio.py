"""Write trio: extracted from normalize_thin_clip.py."""

import json
from pathlib import Path
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from tools.capture.build_frontmatter import build_frontmatter
else:
    from build_frontmatter import build_frontmatter

METADATA_ORDER = (
    "schema_version",
    "clip_id",
    "title",
    "url",
    "normalized_url",
    "canonical_url",
    "site",
    "author",
    "published",
    "language",
    "clipped_at",
    "clipped_from",
    "extension_version",
    "extractor",
    "site_extractor",
    "extractor_version",
    "snapshot_mode",
    "sensitivity",
    "content_sha256",
    "source_html_sha256",
    "asset_count",
    "asset_failures",
    "note",
    "tags",
    "word_count",
)


def write_trio(clip_dir: Path, metadata: dict[str, Any], body: str, html: str) -> None:
    """Write `metadata.json` and a rewritten `index.md`, plus `source.html` if there are bytes.

    `state.json` is deliberately not touched. Both clips already carry one that
    records a real `brainCommit` for the hand synthesis that published them, and
    that is better evidence than anything this pass could invent.
    """
    ordered = {key: metadata[key] for key in METADATA_ORDER}
    if "duplicate_of" in metadata:
        ordered["duplicate_of"] = metadata["duplicate_of"]
    (clip_dir / "metadata.json").write_text(json.dumps(ordered, indent=2) + "\n")
    (clip_dir / "index.md").write_text(build_frontmatter(metadata) + body + "\n")
    if html:
        (clip_dir / "source.html").write_text(html)
