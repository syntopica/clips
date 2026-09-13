"""Sessions convert: hosts."""

from pathlib import Path
from types import ModuleType

import pytest

from tests.sessions_convert_claude_line import _claude_line
from tests.sessions_convert_convert import convert

__all__ = ["convert"]


def test_convert_claude_hosts_writes_a_shared_session_once_under_the_local_host(
    convert: ModuleType,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
) -> None:
    monkeypatch.setattr(convert, "OUT", tmp_path / "out")
    local = tmp_path / "local" / "projects" / "-repo"
    local.mkdir(parents=True)
    line = _claude_line(
        type="user",
        timestamp="2026-09-08T09:00:00Z",
        message={"role": "user", "content": "shared session"},
    )
    (local / "00000000-0000-0000-0000-0000000000ab.jsonl").write_text(line + "\n", encoding="utf-8")
    mirror = tmp_path / "hosts" / "mini" / "claude-projects" / "-repo"
    mirror.mkdir(parents=True)
    (mirror / "00000000-0000-0000-0000-0000000000ab.jsonl").write_text(
        line + "\n", encoding="utf-8"
    )
    (mirror / "11111111-1111-1111-1111-1111111111cd.jsonl").write_text(
        _claude_line(
            type="user",
            timestamp="2026-09-08T10:00:00Z",
            message={"role": "user", "content": "mini only"},
        )
        + "\n",
        encoding="utf-8",
    )
    monkeypatch.setattr(convert, "CLAUDE_ROOT", tmp_path / "local" / "projects")
    monkeypatch.setattr(convert, "HOSTS_MIRROR", tmp_path / "hosts")
    monkeypatch.setattr(convert, "LOCAL_HOST", "thismac")
    monkeypatch.setattr(convert, "DESKTOP_ROOTS", [])

    assert convert.convert_claude_hosts("claude-code") == (2, 0)
    pages = sorted(p.read_text(encoding="utf-8") for p in (tmp_path / "out").rglob("*.md"))
    assert sum("host: thismac" in p for p in pages) == 1
    assert sum("host: mini" in p for p in pages) == 1
    assert sum("shared session" in p for p in pages) == 1
    printed = capsys.readouterr().out
    assert "thismac: 1 sessions, 0 already seen, 1 written, 0 skipped" in printed
    assert "mini: 2 sessions, 1 already seen, 1 written, 0 skipped" in printed


def test_convert_claude_hosts_ignores_subagent_logs_for_the_desktop_store(
    convert: ModuleType, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(convert, "OUT", tmp_path / "out")
    root = tmp_path / "desktop"
    line = _claude_line(
        type="user",
        timestamp="2026-09-08T09:00:00Z",
        message={"role": "user", "content": "desktop turn"},
    )
    wanted = root / "sess-1" / ".claude" / "projects" / "-repo"
    wanted.mkdir(parents=True)
    (wanted / "aaaaaaaa11112222.jsonl").write_text(line + "\n", encoding="utf-8")
    sub = root / "sess-1" / ".claude" / "projects" / "-repo" / "subagents"
    sub.mkdir()
    (sub / "bbbbbbbb33334444.jsonl").write_text(line + "\n", encoding="utf-8")
    stray = root / "sess-1" / "loose"
    stray.mkdir()
    (stray / "cccccccc55556666.jsonl").write_text(line + "\n", encoding="utf-8")
    monkeypatch.setattr(convert, "DESKTOP_ROOTS", [root])
    monkeypatch.setattr(convert, "HOSTS_MIRROR", tmp_path / "no-hosts")
    monkeypatch.setattr(convert, "LOCAL_HOST", "thismac")

    assert convert.convert_claude_hosts("claude-desktop") == (1, 0)
    names = [p.name for p in (tmp_path / "out").rglob("*.md")]
    assert names == ["2026-09-08-desktop-turn-11112222.md"]
