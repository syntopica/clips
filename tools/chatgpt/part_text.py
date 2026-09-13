"""Part text: extracted from convert.py."""


def part_text(part: object) -> str:
    """One content part as text, naming what it was when it is not text.

    An image, a file attachment or an audio part carries no text at all, and
    dropping it silently would make the export claim a turn was empty when it
    was not.
    """
    if isinstance(part, str):
        return part
    if isinstance(part, dict):
        kind = part.get("content_type") or part.get("type") or "part"
        for key in ("text", "transcription", "result"):
            value = part.get(key)
            if isinstance(value, str) and value.strip():
                return value
        name = part.get("name") or part.get("asset_pointer") or ""
        return f"_[{kind}{': ' + name if name else ''}]_"
    return str(part)
