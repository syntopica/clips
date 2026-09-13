"""Sessions convert: rendering."""

from pathlib import Path
from types import ModuleType

import pytest

from tests.sessions_convert_convert import convert

__all__ = ["convert"]


@pytest.mark.parametrize(
    "text",
    [
        "<system-reminder>do a thing</system-reminder>",
        "  \n<command-name>/commit</command-name>",
        "[Request interrupted by user]",
        "## Memory\nsome recalled note",
        "Caveat: The messages below were generated",
    ],
)
def test_injected_user_payloads_are_noise(convert: ModuleType, text: str) -> None:
    assert convert.is_noise(text) is True


def test_typed_text_is_not_noise(convert: ModuleType) -> None:
    assert convert.is_noise("please fix the parser") is False
    # A prefix that appears mid-message is not a prefix.
    assert convert.is_noise("see <system-reminder> in the log") is False


def test_slugify_keeps_six_lowercase_words_and_drops_punctuation(convert: ModuleType) -> None:
    assert convert.slugify("Fix the Parser, please! now ok extra") == "fix-the-parser-please-now-ok"


def test_slugify_truncates_to_sixty_characters_without_a_trailing_hyphen(
    convert: ModuleType,
) -> None:
    slug = convert.slugify("averylongword " * 6)
    assert len(slug) <= 60
    assert not slug.endswith("-")


def test_slugify_falls_back_to_session_when_nothing_survives(convert: ModuleType) -> None:
    assert convert.slugify("!!! ???") == "session"
    assert convert.slugify("") == "session"


def test_message_text_keeps_only_text_blocks(convert: ModuleType) -> None:
    content = [
        {"type": "text", "text": "first"},
        {"type": "tool_use", "name": "Bash", "input": {"command": "ls"}},
        {"type": "tool_result", "content": "output nobody wants"},
        {"type": "text", "text": "second"},
    ]
    assert convert.message_text(content) == "first\n\nsecond"


def test_message_text_passes_a_plain_string_through(convert: ModuleType) -> None:
    assert convert.message_text("just text") == "just text"


def test_message_text_drops_blank_parts_and_unknown_shapes(convert: ModuleType) -> None:
    assert convert.message_text([{"type": "text", "text": "   "}]) == ""
    assert convert.message_text(None) == ""
    assert convert.message_text({"type": "text", "text": "x"}) == ""


def test_iter_jsonl_skips_blank_and_undecodable_lines(convert: ModuleType, tmp_path: Path) -> None:
    path = tmp_path / "log.jsonl"
    path.write_text('{"a": 1}\n\n   \nnot json at all\n{"a": 2}\n', encoding="utf-8")
    assert list(convert.iter_jsonl(path)) == [{"a": 1}, {"a": 2}]


def test_iter_jsonl_yields_non_object_json_unchanged(convert: ModuleType, tmp_path: Path) -> None:
    # Documented in the docstring: the annotation says dict, the code does not
    # filter, and a bare array reaches the caller's .get and raises there.
    path = tmp_path / "log.jsonl"
    path.write_text("[1, 2]\n", encoding="utf-8")
    assert list(convert.iter_jsonl(path)) == [[1, 2]]


def test_iter_jsonl_replaces_undecodable_bytes_instead_of_raising(
    convert: ModuleType, tmp_path: Path
) -> None:
    path = tmp_path / "log.jsonl"
    path.write_bytes(b'{"a": "\xff"}\n')
    assert list(convert.iter_jsonl(path)) == [{"a": "�"}]


def test_write_page_refuses_a_session_with_no_user_turn(
    convert: ModuleType, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(convert, "OUT", tmp_path)
    kept = convert.write_page("codex", "abc", "t", {"created": "2026-01-01"}, [("assistant", "hi")])
    assert kept is False
    assert list(tmp_path.rglob("*.md")) == []


def test_write_page_names_the_file_from_date_slug_and_last_eight_hex(
    convert: ModuleType, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(convert, "OUT", tmp_path)
    meta = {"created": "2026-09-08T10:11:12Z", "cwd": "/w", "updated": "2026-09-08T11:00:00Z"}
    assert convert.write_page(
        "codex", "0198aaaa-bbbb-cccc-dddd-eeeeff001122", "Fix the parser", meta, [("user", "go")]
    )
    written = list(tmp_path.rglob("*.md"))
    assert [p.name for p in written] == ["2026-09-08-fix-the-parser-ff001122.md"]
    assert written[0].parent.name == "codex"


def test_write_page_frontmatter_and_body(
    convert: ModuleType, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(convert, "OUT", tmp_path)
    meta = {"host": "mini", "created": "2026-09-08T10:00:00Z", "updated": "2026-09-08T10:05:00Z"}
    convert.write_page(
        "claude-code",
        "sid-1234abcd",
        'a "quoted" title',
        meta,
        [("user", "  hello  "), ("assistant", "world")],
    )
    text = (tmp_path / "claude-code").glob("*.md").__next__().read_text(encoding="utf-8")
    assert text.startswith("---\n")
    assert "title: \"a 'quoted' title\"\n" in text
    assert "session_id: sid-1234abcd\n" in text
    assert "store: claude-code\n" in text
    assert "host: mini\n" in text
    assert "cwd:" not in text  # absent from meta, so absent from the page
    assert "messages: 2\n" in text
    assert "\n## User\n\nhello\n" in text
    assert "\n## Assistant\n\nworld\n" in text
    assert text.endswith("\n")


def test_write_page_truncates_the_title_at_120_characters(
    convert: ModuleType, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(convert, "OUT", tmp_path)
    convert.write_page("codex", "x" * 8, "T" * 200, {"created": "2026-01-02"}, [("user", "go")])
    text = (tmp_path / "codex").glob("*.md").__next__().read_text(encoding="utf-8")
    assert f'title: "{"T" * 120}"' in text
    assert f"# {'T' * 120}\n" in text
