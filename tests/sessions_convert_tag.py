"""Sessions convert: tag."""

from tests.sessions_convert_varint import _varint


def _tag(field: int, wire: int) -> bytes:
    return _varint((field << 3) | wire)
