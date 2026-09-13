"""Chatgpt tools: queue."""

import json
import sys

from tests.chatgpt_tools_exported_page import exported_page
from tests.chatgpt_tools_load import load

queue_tool = load("queue")


def test_queue_prints_only_the_conversations_not_yet_exported(tmp_path, monkeypatch, capsys):
    out = tmp_path / "chatgpt"
    exported_page(out, "one.md", "id-1")
    index = tmp_path / "index.json"
    index.write_text(
        json.dumps(
            {
                "summaries": [
                    {"id": "id-1"},
                    {"id": "id-2", "archived": True},
                    {"id": "id-3"},
                    {"archived": False},
                ]
            }
        ),
        encoding="utf-8",
    )
    monkeypatch.setattr(sys, "argv", ["queue.py", str(index), str(out)])

    assert queue_tool.main() == 0
    captured = capsys.readouterr()
    assert json.loads(captured.out) == [
        {"id": "id-2", "archived": True},
        {"id": "id-3", "archived": False},
    ]
    assert "2 to fetch, 1 already exported" in captured.err


def test_queue_splits_the_work_into_slices_of_the_requested_size(tmp_path, monkeypatch, capsys):
    out = tmp_path / "chatgpt"
    out.mkdir()
    index = tmp_path / "index.json"
    index.write_text(
        json.dumps({"summaries": [{"id": f"id-{n}"} for n in range(5)]}), encoding="utf-8"
    )
    monkeypatch.setattr(sys, "argv", ["queue.py", str(index), str(out), "2"])

    assert queue_tool.main() == 0
    lines = capsys.readouterr().out.splitlines()
    assert [len(json.loads(line)) for line in lines] == [2, 2, 1]


def test_queue_refuses_without_an_index_and_an_output_directory(monkeypatch, capsys):
    monkeypatch.setattr(sys, "argv", ["queue.py", "only-one"])
    assert queue_tool.main() == 1
    assert "usage: queue.py" in capsys.readouterr().err
