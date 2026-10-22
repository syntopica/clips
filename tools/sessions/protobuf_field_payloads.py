"""Select a schema-known length-delimited field without guessing its content."""

from typing import TYPE_CHECKING

if TYPE_CHECKING or __package__:
    from tools.sessions.read_protobuf_varint import read_protobuf_varint
else:
    from read_protobuf_varint import read_protobuf_varint


def protobuf_field_payloads(buf: bytes, wanted: int) -> list[bytes] | None:
    """Validate the wire message and return all matching payloads in wire order."""
    if wanted < 1 or wanted > (1 << 29) - 1:
        return None
    offset = 0
    selected: list[bytes] = []
    while offset < len(buf):
        tag = read_protobuf_varint(buf, offset)
        if tag is None:
            return None
        value, offset = tag
        field, wire = value >> 3, value & 7
        if field < 1 or field > (1 << 29) - 1:
            return None
        if wire == 0:
            integer = read_protobuf_varint(buf, offset)
            if integer is None:
                return None
            _, offset = integer
        elif wire == 2:
            length = read_protobuf_varint(buf, offset)
            if length is None:
                return None
            size, offset = length
            end = offset + size
            if end > len(buf):
                return None
            if field == wanted:
                selected.append(buf[offset:end])
            offset = end
        elif wire in (1, 5):
            offset += 8 if wire == 1 else 4
            if offset > len(buf):
                return None
        else:
            return None
    return selected
