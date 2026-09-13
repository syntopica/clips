"""Proto strings: extracted from convert.py."""

WIRE_VARINT = 0

WIRE_64BIT = 1

WIRE_LENGTH_DELIMITED = 2

WIRE_32BIT = 5

MAX_PROTO_DEPTH = 4


def proto_strings(buf: bytes, depth: int = 0, path: str = "") -> list[tuple[str, str]]:
    """(field-path, text) for every utf-8 string in a protobuf wire blob.

    No schema exists on disk, so this walks the wire format generically:
    varints are skipped, length-delimited fields are tried as utf-8 and
    recursed into as sub-messages when they are not text.
    """
    i, out = 0, []

    def varint() -> int:
        nonlocal i
        value = shift = 0
        while True:
            byte = buf[i]
            i += 1
            value |= (byte & 0x7F) << shift
            shift += 7
            if not byte & 0x80:
                return value

    while i < len(buf):
        try:
            tag = varint()
            field, wire = tag >> 3, tag & 7
            if wire == WIRE_VARINT:
                varint()
            elif wire == WIRE_LENGTH_DELIMITED:
                length = varint()
                chunk = buf[i : i + length]
                i += length
                try:
                    text = chunk.decode("utf-8")
                    if text and (text.isprintable() or "\n" in text):
                        out.append((f"{path}{field}", text))
                        continue
                except UnicodeDecodeError:
                    pass
                if depth < MAX_PROTO_DEPTH:
                    out += proto_strings(chunk, depth + 1, f"{path}{field}.")
            elif wire == WIRE_32BIT:
                i += 4
            elif wire == WIRE_64BIT:
                i += 8
            else:
                return out
        except IndexError:
            return out
    return out
