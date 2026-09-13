"""Chatgpt tools: convert."""

import json
import sys
from pathlib import Path
from typing import Any

import pytest

from tests.chatgpt_tools_load import load

convert = load("convert")


def node(node_id: str, parent: str | None, message: dict[str, Any] | None) -> dict[str, Any]:
    """One mapping entry in the shape convert.py walks."""
    return {"id": node_id, "parent": parent, "message": message}


def message(role: str, text: str, **metadata: Any) -> dict[str, Any]:
    """A minimal message node with a single text part."""
    return {
        "author": {"role": role},
        "content": {"content_type": "text", "parts": [text]},
        "metadata": metadata,
    }


def tree(
    *pairs: tuple[str, str], title: str = "Talk", create_time: float = 1_700_000_000.0
) -> dict[str, Any]:
    """A conversation tree whose current_node is the last message given."""
    mapping = {"root": node("root", None, None)}
    previous = "root"
    for index, (role, text) in enumerate(pairs):
        key = f"n{index}"
        mapping[key] = node(key, previous, message(role, text))
        previous = key
    return {
        "title": title,
        "mapping": mapping,
        "current_node": previous,
        "create_time": create_time,
        "conversation_id": "c-1",
    }


def test_linear_messages_returns_the_displayed_path_root_first():
    chain = convert.linear_messages(tree(("user", "one"), ("assistant", "two")))
    assert [m["content"]["parts"][0] for m in chain] == ["one", "two"]


def test_linear_messages_stops_on_a_cycle_instead_of_looping():
    cyclic = {
        "current_node": "a",
        "mapping": {
            "a": node("a", "b", message("user", "a")),
            "b": node("b", "a", message("user", "b")),
        },
    }
    assert len(convert.linear_messages(cyclic)) == 2


def test_linear_messages_is_empty_when_the_tree_has_no_mapping():
    assert convert.linear_messages({}) == []


def test_part_text_names_a_part_that_carries_no_text():
    assert convert.part_text({"content_type": "image_asset_pointer", "name": "shot.png"}) == (
        "_[image_asset_pointer: shot.png]_"
    )


def test_part_text_prefers_the_first_non_blank_text_key():
    assert convert.part_text({"content_type": "audio", "text": "   ", "transcription": "hola"}) == (
        "hola"
    )


def test_part_text_passes_a_plain_string_through():
    assert convert.part_text("plain") == "plain"


def test_message_text_fences_code_and_execution_output():
    fenced = convert.message_text({"content": {"content_type": "code", "text": "print(1)"}})
    assert fenced == "```\nprint(1)\n```"


def test_message_text_drops_blank_parts_when_joining():
    text = convert.message_text({"content": {"parts": ["a", "   ", "b"]}})
    assert text == "a\n\nb"


def test_message_text_falls_back_to_a_bare_text_field():
    assert convert.message_text({"content": {"text": "loose"}}) == "loose"


@pytest.mark.parametrize(
    ("payload", "shown"),
    [
        (message("user", "hi"), True),
        (message("user", "hi", is_visually_hidden_from_conversation=True), False),
        (message("system", "you are"), False),
        (message("user", "   "), False),
    ],
)
def test_is_shown_hides_system_hidden_and_empty_turns(payload, shown):
    assert convert.is_shown(payload) is shown


def test_stamp_renders_an_epoch_as_utc_and_an_absent_one_as_empty():
    assert convert.stamp(0) == ""
    assert convert.stamp(1_700_000_000).startswith("2023-11-14T")
    assert convert.stamp(None) == ""


def test_slug_is_lowercase_hyphenated_and_capped():
    assert convert.slug("Hola, Mundo!") == "hola-mundo"
    assert convert.slug(None) == "untitled"
    assert convert.slug("!!!") == "untitled"
    assert len(convert.slug("x" * 100)) == 60


def test_render_writes_frontmatter_and_one_heading_per_visible_turn():
    body = convert.render({"id": "abc", "archived": True}, tree(("user", "q"), ("assistant", "a")))
    assert 'title: "Talk"' in body
    assert "conversation_id: abc" in body
    assert "archived: true" in body
    assert "messages: 2" in body
    assert "url: https://chatgpt.com/c/abc" in body
    assert "## User" in body
    assert "## ChatGPT" in body


def test_render_names_the_model_only_on_assistant_turns():
    conversation = tree(("assistant", "a"))
    for entry in conversation["mapping"].values():
        if entry["message"]:
            entry["message"]["metadata"]["model_slug"] = "gpt-5"
    body = convert.render({"id": "abc"}, conversation)
    assert "## ChatGPT (gpt-5)" in body


def part_file(directory: Path, name: str, records: list[dict[str, Any]]) -> None:
    """Write one downloaded part file in collect.js's envelope shape."""
    (directory / name).write_text(json.dumps({"exported": records}), encoding="utf-8")


def test_main_renders_moves_the_parts_aside_and_reports_nothing_new(tmp_path, monkeypatch, capsys):
    downloads = tmp_path / "dl"
    downloads.mkdir()
    out = tmp_path / "sources"
    monkeypatch.setattr(convert, "OUT", out)
    part_file(
        downloads,
        "chatgpt-run1-part-001.json",
        [{"summary": {"id": "abcdef1234"}, "tree": tree(("user", "q"))}],
    )
    monkeypatch.setattr(sys, "argv", ["convert.py", str(downloads)])

    assert convert.main() == 0
    written = list(out.glob("*.md"))
    assert len(written) == 1
    assert written[0].name.endswith("-abcdef12.md")
    assert (out / "raw" / f"{written[0].stem}.json").is_file()
    assert (downloads / "chatgpt-consumed" / "chatgpt-run1-part-001.json").is_file()
    assert not list(downloads.glob("chatgpt-*part-*.json"))

    # Second run: the part is consumed, so there is nothing to do and that is
    # success, not failure - keeper.sh calls this every five minutes.
    assert convert.main() == 0
    assert "nothing new" in capsys.readouterr().out


def test_main_skips_the_index_file_and_deduplicates_by_conversation_id(tmp_path, monkeypatch):
    downloads = tmp_path / "dl"
    downloads.mkdir()
    monkeypatch.setattr(convert, "OUT", tmp_path / "sources")
    (downloads / "chatgpt-index.json").write_text("{}", encoding="utf-8")
    part_file(
        downloads,
        "chatgpt-part-001.json",
        [
            {"summary": {"id": "dup"}, "tree": tree(("user", "first"))},
            {"summary": {"id": "dup"}, "tree": tree(("user", "second"))},
            {"summary": {}, "tree": tree(("user", "no id"))},
        ],
    )
    monkeypatch.setattr(sys, "argv", ["convert.py", str(downloads)])

    assert convert.main() == 0
    pages = list((tmp_path / "sources").glob("*.md"))
    assert len(pages) == 1
    assert "first" in pages[0].read_text(encoding="utf-8")


def test_main_reports_a_record_whose_tree_never_arrived(tmp_path, monkeypatch, capsys):
    downloads = tmp_path / "dl"
    downloads.mkdir()
    monkeypatch.setattr(convert, "OUT", tmp_path / "sources")
    part_file(downloads, "chatgpt-part-001.json", [{"summary": {"id": "x1"}, "error": "403"}])
    monkeypatch.setattr(sys, "argv", ["convert.py", str(downloads)])

    assert convert.main() == 2
    assert "x1: 403" in capsys.readouterr().err


def test_main_counts_a_conversation_that_rendered_with_no_visible_message(
    tmp_path, monkeypatch, capsys
):
    downloads = tmp_path / "dl"
    downloads.mkdir()
    monkeypatch.setattr(convert, "OUT", tmp_path / "sources")
    part_file(
        downloads,
        "chatgpt-part-001.json",
        [{"summary": {"id": "empty1"}, "tree": tree(("system", "hidden"))}],
    )
    monkeypatch.setattr(sys, "argv", ["convert.py", str(downloads)])

    assert convert.main() == 0
    assert "1 rendered with no visible message" in capsys.readouterr().out
