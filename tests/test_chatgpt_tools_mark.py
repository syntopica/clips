"""Chatgpt tools: mark."""

import sys

from tests.chatgpt_tools_load import load
from tests.chatgpt_tools_read_index import read_index
from tests.chatgpt_tools_write_index import write_index

mark = load("mark")


def test_mark_sets_status_and_route_on_the_named_records_only(tmp_path, monkeypatch):
    index = write_index(tmp_path, {"file": "a.md", "status": "triaged"}, {"file": "b.md"})
    monkeypatch.setattr(
        sys, "argv", ["mark.py", str(tmp_path), "routed", "--route", "topics/x.md", "a.md"]
    )

    assert mark.main() == 0
    records = read_index(index)
    assert records[0] == {"file": "a.md", "status": "routed", "route": "topics/x.md"}
    assert records[1] == {"file": "b.md"}


def test_mark_refuses_and_changes_nothing_when_a_file_is_not_in_the_index(
    tmp_path, monkeypatch, capsys
):
    index = write_index(tmp_path, {"file": "a.md", "status": "triaged"})
    before = index.read_text(encoding="utf-8")
    monkeypatch.setattr(sys, "argv", ["mark.py", str(tmp_path), "discarded", "ghost.md"])

    assert mark.main() == 1
    assert "not in index: ghost.md" in capsys.readouterr().err
    assert index.read_text(encoding="utf-8") == before


def test_mark_reads_extra_filenames_from_stdin(tmp_path, monkeypatch):
    index = write_index(tmp_path, {"file": "a.md"}, {"file": "b.md"})
    monkeypatch.setattr(sys, "argv", ["mark.py", str(tmp_path), "discarded", "-"])
    monkeypatch.setattr(sys, "stdin", iter(["a.md\n", "\n", "b.md\n"]))

    assert mark.main() == 0
    assert [r["status"] for r in read_index(index)] == ["discarded", "discarded"]


def test_mark_leaves_route_untouched_when_none_is_given(tmp_path, monkeypatch):
    index = write_index(tmp_path, {"file": "a.md", "route": "old.md"})
    monkeypatch.setattr(sys, "argv", ["mark.py", str(tmp_path), "triaged", "a.md"])

    assert mark.main() == 0
    assert read_index(index)[0]["route"] == "old.md"
