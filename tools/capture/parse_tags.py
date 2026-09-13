"""Parse tags: extracted from normalize_thin_clip.py."""


def parse_tags(value: str) -> list[str]:
    """The inline `[]` list the Shortcut writes. Anything else is one tag."""
    stripped = value.strip()
    if stripped in ("", "[]"):
        return []
    if stripped.startswith("[") and stripped.endswith("]"):
        return [item.strip().strip("\"'") for item in stripped[1:-1].split(",") if item.strip()]
    return [stripped]
