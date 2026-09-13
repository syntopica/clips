"""Frontmatter fields: extracted from normalize_thin_clip.py."""

import re

FRONTMATTER_KEY = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*:(?!//)")


def frontmatter_fields(block: list[str]) -> dict[str, str]:
    """Key to raw value, with continuation lines folded into the value above.

    The fold is the whole reason this is hand-written rather than `yaml.safe_load`.
    Both captures carry a Shortcuts variable label that leaked into the field, so
    `url:` reads `Imagen` and the URL itself sits on the line beneath it - which a
    YAML parser reads as the single scalar `Imagen https://...`, not a URL, and
    not something that will fetch.
    """
    fields: dict[str, str] = {}
    key = None
    for line in block:
        if FRONTMATTER_KEY.match(line):
            key, _, value = line.partition(":")
            fields[key] = value.strip()
        elif key is not None:
            fields[key] = f"{fields[key]}\n{line.strip()}".strip()
    return fields
