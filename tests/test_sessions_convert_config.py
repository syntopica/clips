"""An unconfigured converter refuses before it can discover any session stores."""

import json

import pytest

from tests.sessions_convert_convert import convert
from tests.sessions_convert_instance import sessions_convert_instance

__all__ = ["convert"]


@pytest.mark.parametrize("data", [None, "", "missing", "file", "no-config", "config-directory"])
def test_main_refuses_missing_instance(convert, tmp_path, monkeypatch, capsys, data):
    if data is not None:
        instance = tmp_path / data
        if data == "file":
            instance.write_text("{}", encoding="utf-8")
        elif data in {"no-config", "config-directory"}:
            instance.mkdir()
            if data == "config-directory":
                (instance / "syntopica.config.json").mkdir()
        monkeypatch.setenv("SYNTOPICA_DATA", str(instance) if data else "")
    # An unknown store must never be dispatched when configuration is missing.
    monkeypatch.setattr(convert.sys, "argv", ["convert.py", "unreachable"])
    before = sorted(tmp_path.rglob("*"))

    assert convert.main() == 78
    captured = capsys.readouterr()
    assert captured.out == ""
    assert captured.err == (
        "convert: SYNTOPICA_DATA must name a directory containing syntopica.config.json\n"
    )
    assert sorted(tmp_path.rglob("*")) == before


@pytest.mark.parametrize(
    "config",
    [
        "{",
        "null",
        "[]",
        "{}",
        '{"brain": null}',
        '{"brain": []}',
        '{"brain": {}}',
        '{"brain": {"sources": null}}',
        '{"brain": {"sources": 1}}',
        '{"brain": {"sources": []}}',
        '{"brain": {"sources": ""}}',
        '{"brain": {"sources": "  "}}',
    ],
)
def test_main_refuses_invalid_config(convert, tmp_path, monkeypatch, capsys, config):
    instance = tmp_path / "instance"
    instance.mkdir()
    (instance / "syntopica.config.json").write_text(config, encoding="utf-8")
    monkeypatch.setenv("SYNTOPICA_DATA", str(instance))
    monkeypatch.setattr(convert.sys, "argv", ["convert.py", "unreachable"])
    before = sorted(tmp_path.rglob("*"))

    assert convert.main() == 78
    captured = capsys.readouterr()
    assert captured.out == ""
    assert captured.err == (
        "convert: SYNTOPICA_DATA/syntopica.config.json must define brain.sources "
        "as a non-empty string in valid JSON\n"
    )
    assert sorted(tmp_path.rglob("*")) == before


def test_write_page_rereads_instance_and_sources_on_each_call(convert, tmp_path, monkeypatch):
    for number in range(2):
        root = tmp_path / str(number)
        root.mkdir()
        sessions_convert_instance(root, monkeypatch)
        instance = root / "instance"
        for sources in ("captured/conversations", "other-sources"):
            (instance / "syntopica.config.json").write_text(
                json.dumps({"brain": {"sources": sources}}), encoding="utf-8"
            )
            assert convert.write_page(
                "codex", "12345678", "question", {"created": "2026-09-08"}, [("user", "ask")]
            )
            assert len(list((instance / sources / "sessions/codex").glob("*.md"))) == 1
