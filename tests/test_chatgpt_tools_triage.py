"""Chatgpt tools: triage."""

import sys
from pathlib import Path
from typing import Any

import pytest

from tests.chatgpt_tools_load import load
from tests.chatgpt_tools_read_index import read_index
from tests.chatgpt_tools_write_index import write_index

triage = load("triage")


PAGE = """---
title: "A talk"
conversation_id: c-9
created: 2026-08-01T10:00:00+00:00
messages: 4
---

# A talk

body text
"""


def test_parse_conversation_reads_the_frontmatter_and_excerpts_the_body(tmp_path):
    page = tmp_path / "2026-08-01-a-talk-c9.md"
    page.write_text(PAGE, encoding="utf-8")
    parsed = triage.parse_conversation(page)
    assert parsed == {
        "file": page.name,
        "conversation_id": "c-9",
        "title": "A talk",
        "date": "2026-08-01",
        "messages": "4",
        "excerpt": "# A talk\n\nbody text",
    }


def test_parse_conversation_survives_a_page_with_no_frontmatter(tmp_path):
    page = tmp_path / "bare.md"
    page.write_text("just a body", encoding="utf-8")
    parsed = triage.parse_conversation(page)
    assert parsed["title"] == ""
    assert parsed["excerpt"] == "just a body"


def test_parse_conversation_caps_the_excerpt(tmp_path):
    page = tmp_path / "long.md"
    page.write_text("y" * (triage.EXCERPT_CHARS * 2), encoding="utf-8")
    assert len(triage.parse_conversation(page)["excerpt"]) == triage.EXCERPT_CHARS


def test_known_projects_lists_the_wiki_project_page_stems(tmp_path):
    projects = tmp_path / "projects"
    projects.mkdir()
    (projects / "brain.md").touch()
    (projects / "atrium.md").touch()
    (projects / "notes.txt").touch()
    source_dir = tmp_path / "sources" / "chatgpt"
    source_dir.mkdir(parents=True)
    assert triage.known_projects(source_dir) == ["atrium", "brain"]


def test_batch_prompt_carries_every_conversation_and_the_project_list():
    batch = [{"file": "a.md", "title": "T", "date": "2026-01-01", "messages": "2", "excerpt": "hi"}]
    prompt = triage.batch_prompt(batch, ["brain", "atrium"])
    assert "=== file: a.md" in prompt
    assert "Known projects: brain, atrium" in prompt
    assert "hi" in prompt


def conversations(*names: str) -> list[dict[str, str]]:
    """Parsed-conversation stubs, complete enough for prompt building too."""
    return [
        {"file": name, "title": "T", "date": "2026-01-01", "messages": "2", "excerpt": "hi"}
        for name in names
    ]


def test_triage_validate_items_reorders_to_the_batch_order():
    answer = {
        "items": [
            {"file": "b.md", "topics": ["x"], "project": "", "value": "low", "summary": "s"},
            {"file": "a.md", "topics": ["y"], "project": "", "value": "high", "summary": "s"},
        ]
    }
    items = triage.validate_items(answer, conversations("a.md", "b.md"))
    assert [item["file"] for item in items] == ["a.md", "b.md"]


@pytest.mark.parametrize(
    "item",
    [
        {"file": "a.md", "topics": ["x"], "project": "", "value": "maybe", "summary": "s"},
        {"file": "a.md", "topics": [], "project": "", "value": "low", "summary": "s"},
        {"file": "a.md", "topics": "x", "project": "", "value": "low", "summary": "s"},
        {"file": "a.md", "topics": ["x"], "project": None, "value": "low", "summary": "s"},
        {"file": "a.md", "topics": ["x"], "project": "", "value": "low", "summary": 3},
    ],
)
def test_triage_validate_items_rejects_an_out_of_range_or_malformed_item(item):
    assert triage.validate_items({"items": [item]}, conversations("a.md")) is None


def test_triage_batch_retries_once_before_giving_up(monkeypatch):
    attempts = []
    monkeypatch.setattr(triage, "run_agy", lambda p, s: attempts.append(1))
    assert triage.triage_batch(conversations("a.md"), [], "/tmp/s.json") is None
    assert len(attempts) == 2


def triage_corpus(tmp_path: Path) -> Path:
    """A minimal wiki layout: sources/chatgpt with pages, and a projects dir."""
    source_dir = tmp_path / "sources" / "chatgpt"
    source_dir.mkdir(parents=True)
    (tmp_path / "projects").mkdir()
    return source_dir


def answer_for(prompt: str, value: str = "medium") -> dict[str, Any]:
    """A well-formed answer covering exactly the files named in a prompt."""
    names = [line.split("=== file: ")[1] for line in prompt.splitlines() if "=== file: " in line]
    return {
        "items": [
            {"file": n, "topics": ["t"], "project": "", "value": value, "summary": "s"}
            for n in names
        ]
    }


def test_triage_main_appends_one_index_record_per_conversation(tmp_path, monkeypatch):
    source_dir = triage_corpus(tmp_path)
    (source_dir / "a.md").write_text(PAGE, encoding="utf-8")
    (source_dir / "b.md").write_text(PAGE, encoding="utf-8")
    monkeypatch.setattr(triage, "run_agy", lambda prompt, schema: answer_for(prompt))
    monkeypatch.setattr(sys, "argv", ["triage.py", str(source_dir), "--workers", "1"])

    assert triage.main() == 0
    records = read_index(source_dir / "index.jsonl")
    assert {r["file"] for r in records} == {"a.md", "b.md"}
    first = records[0]
    assert first["status"] == "triaged"
    assert first["conversation_id"] == "c-9"
    assert first["value"] == "medium"
    assert first["triaged_at"].endswith("+00:00")


def test_triage_main_skips_conversations_already_in_the_index(tmp_path, monkeypatch, capsys):
    source_dir = triage_corpus(tmp_path)
    (source_dir / "a.md").write_text(PAGE, encoding="utf-8")
    (source_dir / "b.md").write_text(PAGE, encoding="utf-8")
    write_index(source_dir, {"file": "a.md"})
    seen: list[str] = []

    def fake_run_agy(prompt, schema):
        seen.extend(
            line.split("=== file: ")[1] for line in prompt.splitlines() if "=== file: " in line
        )
        return answer_for(prompt)

    monkeypatch.setattr(triage, "run_agy", fake_run_agy)
    monkeypatch.setattr(sys, "argv", ["triage.py", str(source_dir), "--workers", "1"])

    assert triage.main() == 0
    assert seen == ["b.md"]
    assert "1 to triage, 1 already in index" in capsys.readouterr().err


def test_triage_main_is_a_no_op_when_everything_is_already_indexed(tmp_path, monkeypatch):
    source_dir = triage_corpus(tmp_path)
    (source_dir / "a.md").write_text(PAGE, encoding="utf-8")
    write_index(source_dir, {"file": "a.md"})

    def refuse(prompt, schema):
        raise AssertionError("no model call should be made")

    monkeypatch.setattr(triage, "run_agy", refuse)
    monkeypatch.setattr(sys, "argv", ["triage.py", str(source_dir)])
    assert triage.main() == 0


def test_triage_main_leaves_a_failed_batch_untriaged_and_exits_non_zero(
    tmp_path, monkeypatch, capsys
):
    source_dir = triage_corpus(tmp_path)
    (source_dir / "a.md").write_text(PAGE, encoding="utf-8")
    monkeypatch.setattr(triage, "run_agy", lambda prompt, schema: None)
    monkeypatch.setattr(sys, "argv", ["triage.py", str(source_dir), "--workers", "1"])

    assert triage.main() == 1
    assert not (source_dir / "index.jsonl").exists()
    assert "batch failed, left untriaged" in capsys.readouterr().err


def test_triage_main_honours_the_batch_limit(tmp_path, monkeypatch):
    source_dir = triage_corpus(tmp_path)
    for name in ("a.md", "b.md", "c.md"):
        (source_dir / name).write_text(PAGE, encoding="utf-8")
    monkeypatch.setattr(triage, "run_agy", lambda prompt, schema: answer_for(prompt))
    monkeypatch.setattr(
        sys,
        "argv",
        ["triage.py", str(source_dir), "--batch-size", "1", "--limit", "2", "--workers", "1"],
    )

    assert triage.main() == 0
    assert len(read_index(source_dir / "index.jsonl")) == 2
