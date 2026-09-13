"""Sessions convert: protobuf."""

from types import ModuleType

from tests.sessions_convert_convert import convert
from tests.sessions_convert_string import _string
from tests.sessions_convert_submessage import _submessage
from tests.sessions_convert_tag import _tag
from tests.sessions_convert_varint import _varint

__all__ = ["convert"]


def test_proto_strings_reports_the_field_path_of_each_string(convert: ModuleType) -> None:
    blob = _string(1, "top") + _submessage(19, _string(2, "nested user text"))
    assert convert.proto_strings(blob) == [("1", "top"), ("19.2", "nested user text")]


def test_proto_strings_skips_varint_and_fixed_width_fields(convert: ModuleType) -> None:
    blob = _tag(3, 0) + _varint(300) + _tag(4, 5) + b"\x00\x00\x00\x00" + _string(5, "kept")
    blob += _tag(6, 1) + b"\x00" * 8 + _string(7, "also kept")
    assert convert.proto_strings(blob) == [("5", "kept"), ("7", "also kept")]


def test_proto_strings_stops_at_the_depth_limit(convert: ModuleType) -> None:
    # Field numbers >= 16 so each tag byte is 0x82.., which is not a valid
    # utf-8 lead byte: that is what makes the walk recurse instead of reading
    # the sub-message as text.
    deep = _string(20, "too deep")
    for field in (21, 22, 23, 24, 25):
        deep = _submessage(field, deep)
    assert convert.proto_strings(deep) == []
    shallower = _string(20, "reachable")
    for field in (21, 22, 23, 24):
        shallower = _submessage(field, shallower)
    assert convert.proto_strings(shallower) == [("24.23.22.21.20", "reachable")]


def test_proto_strings_keeps_a_length_that_runs_past_the_buffer(convert: ModuleType) -> None:
    # A truncated blob does not raise: the slice is short and the walk keeps
    # whatever bytes were there, then falls off the end of the buffer.
    blob = _string(1, "kept") + _tag(2, 2) + _varint(50) + b"short"
    assert convert.proto_strings(blob) == [("1", "kept"), ("2", "short")]


def test_proto_strings_reads_a_short_field_one_submessage_as_text(convert: ModuleType) -> None:
    """Known defect, documented not fixed: field 1 length-delimited tags as 0x0a.

    The walk accepts any utf-8 chunk containing a newline as text, and 0x0a is
    both "\n" and the wire tag for field 1. So a sub-message whose first field
    is 1 and whose bytes all decode is never recursed into, and its text is
    reported at the parent's path with the wire bytes still attached. It only
    survives when the payload is long enough (>=128 bytes) for the length
    varint to break the utf-8 decode.
    """
    short = _submessage(20, _string(1, "the reply"))
    assert convert.proto_strings(short) == [("20", "\n\tthe reply")]
    long_reply = "x" * 200
    assert convert.proto_strings(_submessage(20, _string(1, long_reply))) == [("20.1", long_reply)]


def test_proto_strings_returns_early_on_an_unknown_wire_type(convert: ModuleType) -> None:
    blob = _string(1, "kept") + _tag(2, 3) + _string(3, "unreachable")
    assert convert.proto_strings(blob) == [("1", "kept")]
