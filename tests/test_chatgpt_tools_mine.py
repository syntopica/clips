"""Chatgpt tools: mine."""

import json
import sys
import tempfile
from pathlib import Path

import pytest

from tests.chatgpt_tools_load import load

mine = load("mine")


def test_conversation_block_strips_frontmatter_and_labels_the_file(tmp_path):
    (tmp_path / "a.md").write_text("---\ntitle: t\n---\n# Body\n", encoding="utf-8")
    block = mine.conversation_block(tmp_path, "a.md")
    assert block.startswith("\n=== file: a.md\n")
    assert "title: t" not in block
    assert "# Body" in block


def test_conversation_block_elides_the_middle_of_an_oversized_conversation(tmp_path):
    (tmp_path / "big.md").write_text("x" * (mine.CONTENT_CHARS * 2), encoding="utf-8")
    block = mine.conversation_block(tmp_path, "big.md")
    assert "[... middle truncated ...]" in block
    assert len(block) < mine.CONTENT_CHARS + 200


@pytest.mark.parametrize(
    ("stdout", "expected"),
    [
        (json.dumps({"structured_output": {"items": []}}), {"items": []}),
        (json.dumps({"response": json.dumps({"items": [1]})}), {"items": [1]}),
        (json.dumps({"response": "not json"}), None),
        (json.dumps(["a list"]), None),
        ("not json at all", None),
        (json.dumps({}), None),
    ],
)
def test_unwrap_agy_response_prefers_structured_output_and_rejects_prose(stdout, expected):
    assert mine.unwrap_agy_response(stdout) == expected


def test_validate_items_reorders_the_answer_to_match_the_input_order():
    answer = {
        "items": [
            {"file": "b.md", "keep": False, "findings": []},
            {"file": "a.md", "keep": True, "findings": [{"summary": "s", "detail": "d"}]},
        ]
    }
    items = mine.validate_items(answer, ["a.md", "b.md"])
    assert [item["file"] for item in items] == ["a.md", "b.md"]


@pytest.mark.parametrize(
    "answer",
    [
        None,
        {"items": "not a list"},
        {"items": [{"file": "a.md", "keep": True, "findings": []}]},  # missing b.md
        {"items": [{"file": "ghost.md", "keep": True, "findings": []}]},  # unknown file
        {  # duplicated file
            "items": [
                {"file": "a.md", "keep": True, "findings": []},
                {"file": "a.md", "keep": True, "findings": []},
            ]
        },
        {"items": [{"file": "a.md", "keep": "yes", "findings": []}]},  # keep not a bool
        {"items": [{"file": "a.md", "keep": True, "findings": "none"}]},  # findings not a list
        {"items": ["a string, not an item"]},
    ],
)
def test_validate_items_rejects_a_batch_it_cannot_match_exactly(answer):
    assert mine.validate_items(answer, ["a.md", "b.md"]) is None


def test_run_agy_never_skips_permissions_and_stays_in_plan_mode(monkeypatch):
    seen = {}

    class Result:
        returncode = 0
        stdout = json.dumps({"structured_output": {"items": []}})
        stderr = ""

    def fake_run(argv, **kwargs):
        seen["argv"] = argv
        seen["kwargs"] = kwargs
        return Result()

    monkeypatch.setattr(mine.subprocess, "run", fake_run)
    assert mine.run_agy("prompt", "/tmp/schema.json") == {"items": []}
    assert seen["argv"][0] == "agy"
    assert "--sandbox" in seen["argv"]
    assert seen["argv"][seen["argv"].index("--mode") + 1] == "plan"
    assert "--dangerously-skip-permissions" not in seen["argv"]
    assert seen["argv"][seen["argv"].index("--model") + 1] == mine.AGY_BULK_MODEL
    assert seen["kwargs"]["check"] is False


def test_run_agy_returns_none_on_a_timeout_rather_than_raising(monkeypatch):
    def fake_run(argv, **kwargs):
        raise mine.subprocess.TimeoutExpired(argv, 1)

    monkeypatch.setattr(mine.subprocess, "run", fake_run)
    assert mine.run_agy("prompt", "/tmp/schema.json") is None


def test_run_agy_returns_none_and_reports_a_non_zero_exit(monkeypatch, capsys):
    class Result:
        returncode = 3
        stdout = ""
        stderr = "quota reached"

    monkeypatch.setattr(mine.subprocess, "run", lambda argv, **kwargs: Result())
    assert mine.run_agy("prompt", "/tmp/schema.json") is None
    assert "agy exited 3" in capsys.readouterr().err


def test_mine_main_batches_the_input_and_prints_one_item_per_conversation(
    tmp_path, monkeypatch, capsys
):
    for name in ("a.md", "b.md", "c.md"):
        (tmp_path / name).write_text(f"body of {name}", encoding="utf-8")

    calls: list[list[str]] = []

    def fake_run_agy(prompt, schema_path):
        names = [
            line.split("=== file: ")[1] for line in prompt.splitlines() if "=== file: " in line
        ]
        calls.append(names)
        return {"items": [{"file": n, "keep": True, "findings": []} for n in names]}

    monkeypatch.setattr(mine, "run_agy", fake_run_agy)
    monkeypatch.setattr(
        sys, "argv", ["mine.py", str(tmp_path), "a.md", "b.md", "c.md", "--batch-size", "2"]
    )

    assert mine.main() == 0
    assert calls == [["a.md", "b.md"], ["c.md"]]
    printed = json.loads(capsys.readouterr().out)
    assert [item["file"] for item in printed["items"]] == ["a.md", "b.md", "c.md"]
    assert printed["failed"] == []


def test_mine_main_retries_once_and_then_records_the_batch_as_failed(tmp_path, monkeypatch, capsys):
    (tmp_path / "a.md").write_text("body", encoding="utf-8")
    attempts = []
    monkeypatch.setattr(mine, "run_agy", lambda p, s: attempts.append(1))
    monkeypatch.setattr(sys, "argv", ["mine.py", str(tmp_path), "a.md"])

    assert mine.main() == 1
    assert len(attempts) == 2
    assert json.loads(capsys.readouterr().out)["failed"] == ["a.md"]


def test_mine_main_refuses_when_no_filenames_are_given(tmp_path, monkeypatch, capsys):
    monkeypatch.setattr(sys, "argv", ["mine.py", str(tmp_path)])
    monkeypatch.setattr(sys, "stdin", iter([]))

    assert mine.main() == 1
    assert "no files given" in capsys.readouterr().err


def test_mine_main_leaves_its_schema_file_behind(tmp_path, monkeypatch):
    """Documents today's behaviour: the temp schema is never removed.

    Both mine.py and triage.py say the schema file "is closed and removed by
    hand below" and neither ever removes it. Recorded here rather than fixed,
    because fixing it is a behaviour change and this pass is not one.
    """
    (tmp_path / "a.md").write_text("body", encoding="utf-8")
    created: list[str] = []
    real = tempfile.NamedTemporaryFile

    def spy(*args, **kwargs):
        handle = real(*args, **kwargs)
        created.append(handle.name)
        return handle

    monkeypatch.setattr(mine.tempfile, "NamedTemporaryFile", spy)
    monkeypatch.setattr(
        mine, "run_agy", lambda p, s: {"items": [{"file": "a.md", "keep": False, "findings": []}]}
    )
    monkeypatch.setattr(sys, "argv", ["mine.py", str(tmp_path), "a.md"])

    assert mine.main() == 0
    assert len(created) == 1
    leaked = Path(created[0])
    assert leaked.is_file()
    assert json.loads(leaked.read_text(encoding="utf-8")) == mine.OUTPUT_SCHEMA
    leaked.unlink()
