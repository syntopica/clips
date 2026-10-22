"""Mapped Antigravity text paths reject ambiguous or incomplete wire data."""

import pytest

from tests.sessions_convert_string import _string
from tests.sessions_convert_submessage import _submessage
from tests.sessions_convert_tag import _tag
from tests.sessions_convert_varint import _varint
from tools.sessions.antigravity_step_text import antigravity_step_text


@pytest.mark.parametrize(
    ("payload", "path", "expected"),
    [
        (_submessage(20, _string(1, "OK")), "20.1", "OK"),
        (_submessage(20, _string(3, "private reasoning")), "20.1", None),
        (_submessage(20, _string(1, "OK")), "20.3", None),
        (_submessage(20, _string(1, "first") + _string(1, "second")), "20.1", "first"),
        (
            _submessage(20, _string(1, "first")) + _submessage(20, _string(1, "second")),
            "20.1",
            "first",
        ),
        (
            _submessage(20, _string(3, "private reasoning")) + _submessage(20, _string(1, "OK")),
            "20.1",
            "OK",
        ),
        (
            _submessage(20, _string(1, "")) + _submessage(20, _string(1, "OK")),
            "20.1",
            "OK",
        ),
        (_submessage(20, _string(1, " ") + _string(1, "OK")), "20.1", "OK"),
        (_tag(20, 2) + _varint(100) + b"short", "20.1", None),
        (_submessage(20, _tag(1, 2) + _varint(100) + b"short"), "20.1", None),
        (_submessage(20, _submessage(1, b"\xff")), "20.1", None),
        (_submessage(20, _string(1, "OK")) + b"\x80", "20.1", None),
        (_submessage(20, _string(1, "OK")) + _tag(2, 3), "20.1", None),
        (_submessage(20, _string(1, "OK")) + b"\x00", "20.1", None),
        (_tag(2, 0) + b"\x80" * 10 + _submessage(20, _string(1, "OK")), "20.1", None),
        (
            _tag(2, 1)
            + b"\x00" * 8
            + _tag(3, 5)
            + b"\x00" * 4
            + _tag(4, 0)
            + _varint(300)
            + _submessage(20, _string(1, "OK")),
            "20.1",
            "OK",
        ),
        (_tag(2, 1) + b"short", "20.1", None),
        (_submessage(20, _string(1, "")), "20.1", None),
    ],
)
def test_antigravity_step_text_uses_only_the_mapped_leaf(
    payload: bytes, path: str, expected: str | None
) -> None:
    assert antigravity_step_text(payload, path) == expected
