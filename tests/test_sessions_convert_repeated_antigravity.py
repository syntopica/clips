"""Repeated Antigravity messages retain the first nonempty visible reply."""

from pathlib import Path
from types import ModuleType

import pytest

from tests.sessions_convert_convert import convert
from tests.sessions_convert_instance import sessions_convert_instance
from tests.test_sessions_convert_antigravity import _antigravity_db, _step_payload

__all__ = ["convert"]


@pytest.mark.parametrize(
    "payload",
    [
        _step_payload(20, 3, "REASONING_ONLY") + _step_payload(20, 1, "visible reply"),
        _step_payload(20, 1, "") + _step_payload(20, 1, "visible reply"),
        _step_payload(20, 1, " ") + _step_payload(20, 1, "visible reply"),
        _step_payload(20, 1, "visible reply") + _step_payload(20, 1, "SECOND_REPLY"),
    ],
)
def test_antigravity_scans_repeated_messages_for_the_first_visible_reply(
    convert: ModuleType, tmp_path: Path, monkeypatch: pytest.MonkeyPatch, payload: bytes
) -> None:
    out = sessions_convert_instance(tmp_path, monkeypatch)
    root = tmp_path / "conversations"
    root.mkdir()
    _antigravity_db(
        root / "synthetic-repeated-reply.db",
        [(0, 14, _step_payload(19, 2, "synthetic question")), (1, 15, payload)],
    )
    monkeypatch.setattr(convert, "ANTIGRAVITY_ROOT", root)
    assert convert.convert_antigravity() == (1, 0)
    pages = list((out / "antigravity").glob("*.md"))
    assert len(pages) == 1
    text = pages[0].read_text()
    assert "messages: 2\n" in text
    assert "## Assistant\n\nvisible reply\n" in text
    assert "REASONING_ONLY" not in text and "SECOND_REPLY" not in text
