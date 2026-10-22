"""Short Antigravity replies must survive schema-directed field extraction."""

from pathlib import Path
from types import ModuleType

import pytest

from tests.sessions_convert_convert import convert
from tests.sessions_convert_instance import sessions_convert_instance
from tests.test_sessions_convert_antigravity import _antigravity_db, _step_payload

__all__ = ["convert"]


@pytest.mark.parametrize("reply", ["OK", "the reply", "Sí, mañana.", "first\nsecond", "x" * 200])
def test_antigravity_keeps_replies_without_reasoning_or_tools(
    convert: ModuleType, tmp_path: Path, monkeypatch: pytest.MonkeyPatch, reply: str
) -> None:
    out = sessions_convert_instance(tmp_path, monkeypatch)
    root = tmp_path / "conversations"
    root.mkdir()
    _antigravity_db(
        root / "synthetic-short-reply.db",
        [
            (0, 14, _step_payload(19, 2, "synthetic question")),
            (1, 15, _step_payload(20, 1, reply) + _step_payload(20, 3, "REASONING_ONLY")),
            (2, 7, _step_payload(19, 2, "TOOL_ONLY")),
            (3, 2, _step_payload(12, 2, "synthetic final")),
        ],
    )
    monkeypatch.setattr(convert, "ANTIGRAVITY_ROOT", root)
    assert convert.convert_antigravity() == (1, 0)
    pages = list((out / "antigravity").glob("*.md"))
    assert len(pages) == 1
    text = pages[0].read_text()
    assert "messages: 3\n" in text
    assert f"## Assistant\n\n{reply}\n" in text
    assert "synthetic question" in text and "synthetic final" in text
    assert "REASONING_ONLY" not in text and "TOOL_ONLY" not in text
