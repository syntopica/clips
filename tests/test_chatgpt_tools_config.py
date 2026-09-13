"""A missing instance must refuse even when there are no new parts."""

import json
import sys

import pytest

from tests.chatgpt_tools_instance import chatgpt_tools_instance
from tests.chatgpt_tools_load import load
from tests.test_chatgpt_tools_convert import part_file, tree


@pytest.mark.parametrize("data", [None, "", "missing", "file", "no-config", "config-directory"])
def test_main_refuses_missing_instance(tmp_path, monkeypatch, capsys, data):
    monkeypatch.delenv("SYNTOPICA_DATA", raising=False)
    convert = load("convert")
    downloads = tmp_path / "downloads"
    downloads.mkdir()
    if data is not None:
        instance = tmp_path / data
        if data == "file":
            instance.write_text("{}", encoding="utf-8")
        elif data in {"no-config", "config-directory"}:
            instance.mkdir()
            if data == "config-directory":
                (instance / "syntopica.config.json").mkdir()
        monkeypatch.setenv("SYNTOPICA_DATA", str(instance) if data else "")
    monkeypatch.setattr(sys, "argv", ["convert.py", str(downloads)])
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
def test_main_refuses_invalid_config_without_consuming_parts(tmp_path, monkeypatch, capsys, config):
    convert = load("convert")
    instance = tmp_path / "instance"
    instance.mkdir()
    (instance / "syntopica.config.json").write_text(config, encoding="utf-8")
    downloads = tmp_path / "downloads"
    downloads.mkdir()
    part = downloads / "chatgpt-part-001.json"
    part.write_text('{"exported": []}', encoding="utf-8")
    monkeypatch.setenv("SYNTOPICA_DATA", str(instance))
    monkeypatch.setattr(sys, "argv", ["convert.py", str(downloads)])
    before = sorted(tmp_path.rglob("*"))

    assert convert.main() == 78
    captured = capsys.readouterr()
    assert captured.out == ""
    assert captured.err == (
        "convert: SYNTOPICA_DATA/syntopica.config.json must define brain.sources "
        "as a non-empty string in valid JSON\n"
    )
    assert sorted(tmp_path.rglob("*")) == before
    assert part.read_text(encoding="utf-8") == '{"exported": []}'


def test_main_refuses_missing_variable_without_consuming_parts(tmp_path, monkeypatch, capsys):
    monkeypatch.delenv("SYNTOPICA_DATA", raising=False)
    convert = load("convert")
    part = tmp_path / "chatgpt-part-001.json"
    part.write_text('{"exported": []}', encoding="utf-8")
    monkeypatch.setattr(sys, "argv", ["convert.py", str(tmp_path)])

    assert convert.main() == 78
    assert "SYNTOPICA_DATA" in capsys.readouterr().err
    assert list(tmp_path.iterdir()) == [part]
    assert part.read_text(encoding="utf-8") == '{"exported": []}'


def test_main_rereads_instance_and_sources_on_each_call(tmp_path, monkeypatch):
    monkeypatch.delenv("SYNTOPICA_DATA", raising=False)
    convert = load("convert")
    downloads = tmp_path / "downloads"
    downloads.mkdir()
    monkeypatch.setattr(sys, "argv", ["convert.py", str(downloads)])
    for number in range(2):
        root = tmp_path / str(number)
        root.mkdir()
        out = chatgpt_tools_instance(root, monkeypatch)
        for sources in ("captured/conversations", "other-sources"):
            instance = root / "instance"
            (instance / "syntopica.config.json").write_text(
                json.dumps({"brain": {"sources": sources}}), encoding="utf-8"
            )
            part_file(
                downloads,
                f"chatgpt-{number}-{sources.split('/')[-1]}-part-001.json",
                [{"summary": {"id": "abcdefgh"}, "tree": tree(("user", "question"))}],
            )
            assert convert.main() == 0
            assert len(list((instance / sources / "chatgpt").glob("*.md"))) == 1
        assert len(list(out.glob("*.md"))) == 1
