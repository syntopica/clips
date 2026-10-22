"""Read one bounded unsigned protobuf varint."""


def read_protobuf_varint(buf: bytes, offset: int) -> tuple[int, int] | None:
    """Return the value and next offset, refusing truncated or oversized values."""
    if offset < 0:
        return None
    value = 0
    for index in range(10):
        if offset >= len(buf):
            return None
        byte = buf[offset]
        offset += 1
        if index == 9 and byte > 1:
            return None
        value |= (byte & 0x7F) << (index * 7)
        if not byte & 0x80:
            return value, offset
    return None
