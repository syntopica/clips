"""Build frontmatter: extracted from normalize_thin_clip.py."""

from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from tools.capture.yaml_scalar import yaml_scalar
else:
    from yaml_scalar import yaml_scalar

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


def build_frontmatter(metadata: dict[str, Any]) -> str:
    """The frontmatter block for a normalised clip.

    `buildFrontmatter`'s output, key order and quoting included, so a normalised
    clip's `index.md` is indistinguishable from a harvested one.
    """
    lines = []
    keys = [*METADATA_ORDER, "duplicate_of"] if "duplicate_of" in metadata else METADATA_ORDER
    for key in keys:
        value = metadata[key]
        if isinstance(value, list):
            lines.append(
                f"{key}: []"
                if not value
                else f"{key}:\n" + "\n".join(f"  - {yaml_scalar(item)}" for item in value)
            )
        else:
            lines.append(f"{key}: {yaml_scalar(value)}")
    return "---\n" + "\n".join(lines) + "\n---\n"
