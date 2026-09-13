"""Sessions convert: string."""

from tests.sessions_convert_tag import _tag
from tests.sessions_convert_varint import _varint


def _string(field: int, text: str) -> bytes:
    raw = text.encode("utf-8")
    return _tag(field, 2) + _varint(len(raw)) + raw
