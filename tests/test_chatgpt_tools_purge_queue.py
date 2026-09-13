"""Chatgpt tools: purge queue."""

import json
import sys
from pathlib import Path

import pytest

from tests.chatgpt_tools_exported_page import exported_page
from tests.chatgpt_tools_load import load

purge_queue = load("purge_queue")


VALID_ID = "0123abcd-4567-89ab-cdef-0123456789ab"


OTHER_ID = "fedcba98-7654-3210-fedc-ba9876543210"


def paired(out: Path, stem: str, conversation_id: str, raw: str | None = '{"ok": true}') -> None:
    """A rendered page and, unless `raw` is None, its raw JSON twin."""
    exported_page(out, f"{stem}.md", conversation_id)
    if raw is not None:
        (out / "raw").mkdir(exist_ok=True)
        (out / "raw" / f"{stem}.json").write_text(raw, encoding="utf-8")


def test_purge_queue_emits_only_ids_backed_by_a_readable_raw_json(tmp_path, monkeypatch, capsys):
    out = tmp_path / "chatgpt"
    paired(out, "good", VALID_ID)
    paired(out, "noraw", OTHER_ID, raw=None)
    monkeypatch.setattr(sys, "argv", ["purge_queue.py", str(out)])

    assert purge_queue.main() == 0
    captured = capsys.readouterr()
    assert json.loads(captured.out) == [VALID_ID]
    assert "withheld noraw.md: no raw json" in captured.err
    assert "1 deletable, 1 withheld" in captured.err


@pytest.mark.parametrize(
    ("stem", "conversation_id", "raw", "reason"),
    [
        ("badid", "not-a-uuid", '{"ok": true}', "no usable conversation_id"),
        ("emptyraw", OTHER_ID, "", "no raw json"),
        ("brokenraw", OTHER_ID, "{not json", "raw json unreadable"),
    ],
)
def test_purge_queue_withholds_anything_not_provably_backed_up(
    tmp_path, monkeypatch, capsys, stem, conversation_id, raw, reason
):
    out = tmp_path / "chatgpt"
    paired(out, stem, conversation_id, raw=raw)
    monkeypatch.setattr(sys, "argv", ["purge_queue.py", str(out)])

    assert purge_queue.main() == 0
    captured = capsys.readouterr()
    assert captured.out == ""
    assert reason in captured.err


def test_purge_queue_refuses_the_whole_run_on_duplicate_ids(tmp_path, monkeypatch, capsys):
    out = tmp_path / "chatgpt"
    paired(out, "one", VALID_ID)
    paired(out, "two", VALID_ID)
    monkeypatch.setattr(sys, "argv", ["purge_queue.py", str(out)])

    assert purge_queue.main() == 1
    captured = capsys.readouterr()
    assert captured.out == ""
    assert "duplicate ids in the export - refusing" in captured.err


def test_purge_queue_reads_a_page_containing_nul_bytes(tmp_path, monkeypatch, capsys):
    out = tmp_path / "chatgpt"
    out.mkdir(parents=True)
    (out / "nul.md").write_text(
        f"---\nconversation_id: {VALID_ID}\n---\n\ninvoice \x00 number\n", encoding="utf-8"
    )
    (out / "raw").mkdir()
    (out / "raw" / "nul.json").write_text("{}", encoding="utf-8")
    monkeypatch.setattr(sys, "argv", ["purge_queue.py", str(out)])

    assert purge_queue.main() == 0
    assert json.loads(capsys.readouterr().out) == [VALID_ID]


def test_purge_queue_slices_the_ids(tmp_path, monkeypatch, capsys):
    out = tmp_path / "chatgpt"
    for n in range(3):
        paired(out, f"p{n}", f"0123abcd-4567-89ab-cdef-01234567890{n}")
    monkeypatch.setattr(sys, "argv", ["purge_queue.py", str(out), "2"])

    assert purge_queue.main() == 0
    lines = capsys.readouterr().out.splitlines()
    assert [len(json.loads(line)) for line in lines] == [2, 1]


def test_purge_queue_refuses_without_a_source_directory(monkeypatch, capsys):
    monkeypatch.setattr(sys, "argv", ["purge_queue.py"])
    assert purge_queue.main() == 1
    assert "usage: purge_queue.py" in capsys.readouterr().err
