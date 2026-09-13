"""Yaml scalar: extracted from normalize_thin_clip.py."""

import json


def yaml_scalar(value: object) -> str:
    """One frontmatter value the way `buildFrontmatter` writes it: null, bool, JSON string, or bare."""
    if value is None:
        return "null"
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, str):
        return json.dumps(value)
    return str(value)
