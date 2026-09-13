"""Sessions convert: claude."""

from pathlib import Path
from types import ModuleType

import pytest

from tests.sessions_convert_claude_line import _claude_line
from tests.sessions_convert_convert import convert
from tests.sessions_convert_instance import sessions_convert_instance

__all__ = ["convert"]


def test_convert_claude_jsonl_filters_sidechains_meta_and_injected_turns(
    convert: ModuleType, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    out = sessions_convert_instance(tmp_path, monkeypatch)
    log = tmp_path / "0123456789abcdef.jsonl"
    log.write_text(
        "\n".join(
            [
                _claude_line(type="summary", summary="Parser work"),
                _claude_line(
                    type="user",
                    timestamp="2026-09-08T09:00:00Z",
                    cwd="/repo",
                    message={"role": "user", "content": "<system-reminder>ignore me"},
                ),
                _claude_line(
                    type="user",
                    timestamp="2026-09-08T09:01:00Z",
                    isSidechain=True,
                    message={"role": "user", "content": "subagent chatter"},
                ),
                _claude_line(
                    type="user",
                    isMeta=True,
                    timestamp="2026-09-08T09:02:00Z",
                    message={"role": "user", "content": "meta"},
                ),
                _claude_line(
                    type="user",
                    timestamp="2026-09-08T09:03:00Z",
                    message={"role": "user", "content": "real question"},
                ),
                _claude_line(
                    type="assistant",
                    timestamp="2026-09-08T09:04:00Z",
                    message={
                        "role": "assistant",
                        "content": [
                            {"type": "text", "text": "real answer"},
                            {"type": "tool_use", "name": "Bash"},
                        ],
                    },
                ),
                _claude_line(type="system", message={"role": "system", "content": "boot"}),
            ]
        )
        + "\n",
        encoding="utf-8",
    )
    kept, skipped = convert.convert_claude_jsonl([log], "claude-code", host="mini")
    assert (kept, skipped) == (1, 0)
    page = (out / "claude-code").glob("*.md").__next__()
    text = page.read_text(encoding="utf-8")
    assert page.name == "2026-09-08-parser-work-89abcdef.md"  # summary wins as the title
    assert "messages: 2\n" in text
    assert "cwd: /repo\n" in text  # taken from the injected turn, which is still metadata
    assert "created: 2026-09-08T09:00:00Z\n" in text
    assert "updated: 2026-09-08T09:04:00Z\n" in text
    assert "ignore me" not in text
    assert "subagent chatter" not in text
    assert "boot" not in text
    assert "Bash" not in text
    assert "real question" in text and "real answer" in text


def test_convert_claude_jsonl_skips_a_log_with_no_timestamped_turn(
    convert: ModuleType, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    out = sessions_convert_instance(tmp_path, monkeypatch)
    log = tmp_path / "empty.jsonl"
    log.write_text(_claude_line(type="summary", summary="nothing") + "\n", encoding="utf-8")
    assert convert.convert_claude_jsonl([log], "claude-code") == (0, 1)
    assert not out.exists()


def test_convert_claude_jsonl_skips_a_log_with_only_assistant_text(
    convert: ModuleType, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    out = sessions_convert_instance(tmp_path, monkeypatch)
    log = tmp_path / "assistant-only.jsonl"
    log.write_text(
        _claude_line(
            type="assistant",
            timestamp="2026-09-08T09:00:00Z",
            message={"role": "assistant", "content": "solo"},
        )
        + "\n",
        encoding="utf-8",
    )
    assert convert.convert_claude_jsonl([log], "claude-code") == (0, 1)
    assert not out.exists()


def test_convert_claude_jsonl_titles_from_the_first_user_line_without_a_summary(
    convert: ModuleType, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    out = sessions_convert_instance(tmp_path, monkeypatch)
    log = tmp_path / "abcdef0123456789.jsonl"
    log.write_text(
        _claude_line(
            type="user",
            timestamp="2026-09-08T09:00:00Z",
            message={"role": "user", "content": "first line here\nsecond line ignored"},
        )
        + "\n",
        encoding="utf-8",
    )
    convert.convert_claude_jsonl([log], "claude-code")
    name = (out / "claude-code").glob("*.md").__next__().name
    assert name == "2026-09-08-first-line-here-23456789.md"
