"""Sessions convert: main."""

from pathlib import Path
from types import ModuleType
from typing import Any

import pytest

from tests.sessions_convert_convert import convert
from tests.sessions_convert_instance import sessions_convert_instance

__all__ = ["convert"]


def test_main_rejects_an_unknown_store(
    convert: ModuleType, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    sessions_convert_instance(tmp_path, monkeypatch)
    monkeypatch.setattr(convert.sys, "argv", ["convert.py", "wechat"])
    with pytest.raises(SystemExit) as excinfo:
        convert.main()
    assert "unknown store: wechat" in str(excinfo.value)


def test_main_dispatches_each_named_store_once(
    convert: ModuleType,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
) -> None:
    sessions_convert_instance(tmp_path, monkeypatch)
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


def test_help_validates_configuration_without_scanning_stores(
    convert: ModuleType,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
) -> None:
    sessions_convert_instance(tmp_path, monkeypatch)
    monkeypatch.setattr(convert.sys, "argv", ["convert.py", "--help"])
    monkeypatch.setattr(convert, "convert_claude_hosts", None)
    monkeypatch.setattr(convert, "convert_codex", None)
    monkeypatch.setattr(convert, "convert_antigravity", None)
    before = sorted(tmp_path.rglob("*"))

    assert convert.main() == 0
    assert capsys.readouterr().out == (
        "Usage: convert.py [claude-code|claude-desktop|codex|antigravity] ...\n"
    )
    assert sorted(tmp_path.rglob("*")) == before
