"""Sessions convert: antigravity."""

import sqlite3
from pathlib import Path
from types import ModuleType

import pytest

from tests.load_sql import load_sql
from tests.sessions_convert_convert import convert
from tests.sessions_convert_instance import sessions_convert_instance
from tests.sessions_convert_string import _string
from tests.sessions_convert_submessage import _submessage

__all__ = ["convert"]


def _step_payload(outer: int, inner: int, text: str) -> bytes:
    """The shape convert_antigravity looks for: text at field path <outer>.<inner>."""
    return _submessage(outer, _string(inner, text))


REPLY = ("the reply, at length " * 12).strip()


def _antigravity_db(path: Path, rows: list[tuple[int, int, bytes | None]]) -> None:
    con = sqlite3.connect(path)
    con.execute(load_sql("sessions_convert/create-steps"))
    con.executemany(load_sql("sessions_convert/insert-steps"), rows)
    con.commit()
    con.close()


def test_convert_antigravity_maps_step_types_to_roles_and_drops_the_rest(
    convert: ModuleType, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    out = sessions_convert_instance(tmp_path, monkeypatch)
    root = tmp_path / "conversations"
    root.mkdir()
    db = root / "aaaaaaaa-1111-2222-3333-44445555abcd.db"
    _antigravity_db(
        db,
        [
            (0, 14, _step_payload(19, 2, "what the user asked")),
            (1, 15, _step_payload(20, 3, "thinking, not kept") + _step_payload(20, 1, REPLY)),
            (2, 7, _step_payload(19, 2, "tool traffic")),
            (3, 2, _step_payload(12, 2, "final result")),
            (4, 14, None),
        ],
    )
    monkeypatch.setattr(convert, "ANTIGRAVITY_ROOT", root)
    assert convert.convert_antigravity() == (1, 0)
    text = (out / "antigravity").glob("*.md").__next__().read_text(encoding="utf-8")
    assert "messages: 3\n" in text
    assert "what the user asked" in text
    assert REPLY in text
    assert "final result" in text
    assert "thinking, not kept" not in text
    assert "tool traffic" not in text


def test_convert_antigravity_skips_a_database_without_the_steps_table(
    convert: ModuleType, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    out = sessions_convert_instance(tmp_path, monkeypatch)
    root = tmp_path / "conversations"
    root.mkdir()
    (root / "broken.db").write_text("not a database at all", encoding="utf-8")
    monkeypatch.setattr(convert, "ANTIGRAVITY_ROOT", root)
    assert convert.convert_antigravity() == (0, 1)
    assert not out.exists()


def test_convert_antigravity_skips_a_conversation_with_no_user_step(
    convert: ModuleType, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    out = sessions_convert_instance(tmp_path, monkeypatch)
    root = tmp_path / "conversations"
    root.mkdir()
    _antigravity_db(root / "assistant-only.db", [(0, 15, _step_payload(20, 1, "reply"))])
    monkeypatch.setattr(convert, "ANTIGRAVITY_ROOT", root)
    assert convert.convert_antigravity() == (0, 1)
    assert not out.exists()
