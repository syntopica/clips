"""Sessions convert: main."""

from types import ModuleType
from typing import Any

import pytest

from tests.sessions_convert_convert import convert

__all__ = ["convert"]


def test_main_rejects_an_unknown_store(
    convert: ModuleType, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(convert.sys, "argv", ["convert.py", "wechat"])
    with pytest.raises(SystemExit) as excinfo:
        convert.main()
    assert "unknown store: wechat" in str(excinfo.value)


def test_main_dispatches_each_named_store_once(
    convert: ModuleType, monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    calls: list[tuple[str, tuple[Any, ...]]] = []

    def record(name: str, result: tuple[int, int]) -> Any:
        def run(*args: Any) -> tuple[int, int]:
            calls.append((name, args))
            return result

        return run

    monkeypatch.setattr(convert.sys, "argv", ["convert.py", "codex", "antigravity"])
    monkeypatch.setattr(convert, "convert_codex", record("codex", (2, 1)))
    monkeypatch.setattr(convert, "convert_antigravity", record("antigravity", (0, 3)))
    monkeypatch.setattr(convert, "convert_claude_hosts", record("claude", (0, 0)))
    convert.main()
    assert [name for name, _ in calls] == ["codex", "antigravity"]
    out = capsys.readouterr().out
    assert "codex: 2 written, 1 skipped" in out
    assert "antigravity: 0 written, 3 skipped" in out
