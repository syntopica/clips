"""Sessions convert: submessage."""

from tests.sessions_convert_tag import _tag
from tests.sessions_convert_varint import _varint


def _submessage(field: int, payload: bytes) -> bytes:
    return _tag(field, 2) + _varint(len(payload)) + payload
