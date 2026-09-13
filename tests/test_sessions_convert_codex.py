"""Sessions convert: codex."""

import json
from pathlib import Path
from types import ModuleType

import pytest

from tests.sessions_convert_convert import convert

__all__ = ["convert"]


def test_convert_codex_uses_the_session_meta_id_and_keeps_message_text(
    convert: ModuleType, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(convert, "OUT", tmp_path / "out")
    root = tmp_path / "codex" / "2026" / "09" / "08"
    root.mkdir(parents=True)
    log = root / "rollout-2026-09-08T09-00-00-filename-id.jsonl"
    log.write_text(
        "\n".join(
            [
                json.dumps(
                    {
                        "type": "session_meta",
                        "payload": {
                            "id": "0198cafe-0000-7000-8000-00000000beef",
                            "timestamp": "2026-09-08T09:00:00Z",
                            "cwd": "/repo",
                        },
                    }
                ),
                json.dumps(
                    {
                        "type": "response_item",
                        "timestamp": "2026-09-08T09:01:00Z",
                        "payload": {
                            "type": "message",
                            "role": "user",
                            "content": [
                                {"type": "input_text", "text": "the ask"},
                                {"type": "input_image", "image_url": "x"},
                            ],
                        },
                    }
                ),
                json.dumps(
                    {
                        "type": "response_item",
                        "timestamp": "2026-09-08T09:02:00Z",
                        "payload": {"type": "function_call", "name": "shell"},
                    }
                ),
                json.dumps(
                    {
                        "type": "response_item",
                        "timestamp": "2026-09-08T09:03:00Z",
                        "payload": {
                            "type": "message",
                            "role": "assistant",
                            "content": [{"type": "output_text", "text": "the answer"}],
                        },
                    }
                ),
            ]
        )
        + "\n",
        encoding="utf-8",
    )
    monkeypatch.setattr(convert, "CODEX_ROOT", tmp_path / "codex")
    assert convert.convert_codex() == (1, 0)
    page = (tmp_path / "out" / "codex").glob("*.md").__next__()
    assert page.name == "2026-09-08-the-ask-0000beef.md"  # id from session_meta, not the filename
    text = page.read_text(encoding="utf-8")
    assert "session_id: 0198cafe-0000-7000-8000-00000000beef\n" in text
    assert "cwd: /repo\n" in text
    assert "messages: 2\n" in text
    assert "the ask" in text and "the answer" in text
    assert "shell" not in text
    assert "image_url" not in text


def test_convert_codex_drops_injected_user_turns_and_then_the_session(
    convert: ModuleType, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(convert, "OUT", tmp_path / "out")
    root = tmp_path / "codex"
    root.mkdir()
    (root / "rollout-x.jsonl").write_text(
        "\n".join(
            [
                json.dumps(
                    {
                        "type": "session_meta",
                        "payload": {"id": "sid-00000001", "timestamp": "2026-09-08T09:00:00Z"},
                    }
                ),
                json.dumps(
                    {
                        "type": "response_item",
                        "payload": {
                            "type": "message",
                            "role": "user",
                            "content": [{"type": "input_text", "text": "<environment_context>x"}],
                        },
                    }
                ),
            ]
        )
        + "\n",
        encoding="utf-8",
    )
    monkeypatch.setattr(convert, "CODEX_ROOT", root)
    assert convert.convert_codex() == (0, 1)


def test_convert_codex_skips_a_rollout_with_no_timestamp_anywhere(
    convert: ModuleType, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(convert, "OUT", tmp_path / "out")
    root = tmp_path / "codex"
    root.mkdir()
    (root / "rollout-y.jsonl").write_text(
        json.dumps(
            {
                "type": "response_item",
                "payload": {
                    "type": "message",
                    "role": "user",
                    "content": [{"type": "input_text", "text": "orphan"}],
                },
            }
        )
        + "\n",
        encoding="utf-8",
    )
    monkeypatch.setattr(convert, "CODEX_ROOT", root)
    assert convert.convert_codex() == (0, 1)
