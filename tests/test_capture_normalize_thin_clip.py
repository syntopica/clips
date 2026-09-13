"""Repairing a thin mobile clip: recovering a URL a Shortcut corrupted, and rebuilding metadata.

The population is two directories and each is the cited source of a live wiki
page, so the interesting behaviour is where the pass refuses rather than
guesses, and the byte-for-byte frontmatter it has to reproduce for a normalised
clip to be indistinguishable from a harvested one.
"""

import json

import pytest

from tests.capture_modules import load_capture_module, write_clip
from tests.load_sql import load_sql

# The frontmatter a Shortcut actually wrote: the `url` field holds the variable
# label and the URL itself landed on the continuation line beneath it.
LEAKED_FRONTMATTER = """---
title: A post
url: Imagen
  https://medium.com/@Author/A-Post
clipped_at: 2026-07-15T09:30:00+00:00
tags: [ai, "tools"]
note: read on the train
---

Body text.
"""


@pytest.fixture(scope="module")
def thin():
    return load_capture_module("normalize_thin_clip")


def test_frontmatter_block_returns_the_lines_between_the_fences(thin, tmp_path) -> None:
    block = thin.frontmatter_block(LEAKED_FRONTMATTER, tmp_path)
    assert block[0] == "title: A post"
    assert block[-1] == "note: read on the train"


def test_frontmatter_block_refuses_a_file_with_no_fence(thin, tmp_path) -> None:
    with pytest.raises(thin.ThinClipError, match="no frontmatter fence"):
        thin.frontmatter_block("title: x\n", tmp_path)


def test_frontmatter_block_refuses_a_fence_that_never_closes(thin, tmp_path) -> None:
    with pytest.raises(thin.ThinClipError, match="never closed"):
        thin.frontmatter_block("---\ntitle: x\n", tmp_path)


def test_a_continuation_line_folds_into_the_field_above_it(thin, tmp_path) -> None:
    fields = thin.frontmatter_fields(thin.frontmatter_block(LEAKED_FRONTMATTER, tmp_path))
    assert fields["url"] == "Imagen\nhttps://medium.com/@Author/A-Post"


def test_a_url_on_its_own_line_is_not_read_as_a_new_field(thin, tmp_path) -> None:
    fields = thin.frontmatter_fields(thin.frontmatter_block(LEAKED_FRONTMATTER, tmp_path))
    assert "https" not in fields


def test_recover_url_finds_the_one_url_in_a_corrupted_field(thin, tmp_path) -> None:
    assert (
        thin.recover_url("Imagen\nhttps://medium.com/@Author/A-Post", tmp_path)
        == "https://medium.com/@Author/A-Post"
    )


def test_recover_url_refuses_a_field_with_no_url(thin, tmp_path) -> None:
    with pytest.raises(thin.ThinClipError, match="no https:// URL"):
        thin.recover_url("Imagen", tmp_path)


def test_recover_url_refuses_to_pick_between_two_urls(thin, tmp_path) -> None:
    with pytest.raises(thin.ThinClipError, match="refusing to pick"):
        thin.recover_url("https://a/one https://b/two", tmp_path)


@pytest.mark.parametrize(
    ("written", "expected"),
    [
        ("", []),
        ("[]", []),
        ("[ai, \"tools\", 'x']", ["ai", "tools", "x"]),
        ("[a, , b]", ["a", "b"]),
        ("single", ["single"]),
    ],
)
def test_parse_tags_reads_the_inline_list_the_shortcut_writes(thin, written, expected) -> None:
    assert thin.parse_tags(written) == expected


def test_read_thin_clip_recovers_every_field_the_trio_needs(thin, tmp_path) -> None:
    clip = write_clip(tmp_path, "clips/pending/a", files={"index.md": LEAKED_FRONTMATTER})
    assert thin.read_thin_clip(clip) == {
        "url": "https://medium.com/@Author/A-Post",
        "clipped_at": "2026-07-15T09:30:00+00:00",
        "capture_source": "ios-shortcut",
        "note": "read on the train",
        "tags": ["ai", "tools"],
    }


def test_a_clip_id_is_a_ulid_whose_clock_half_decodes_back(thin) -> None:
    clip_id = thin.new_clip_id(1_752_570_600_000)
    assert len(clip_id) == 26
    decoded = 0
    for character in clip_id[:10]:
        decoded = decoded * 32 + thin.CROCKFORD.index(character)
    assert decoded == 1_752_570_600_000


def test_two_clip_ids_from_the_same_instant_still_differ(thin) -> None:
    assert thin.new_clip_id(1_752_570_600_000) != thin.new_clip_id(1_752_570_600_000)


def test_clipped_at_milliseconds_uses_the_captures_own_timestamp(thin) -> None:
    assert thin.clipped_at_milliseconds("2026-07-15T09:30:00+00:00") == 1_784_107_800_000


def test_normalized_url_keeps_the_path_case_the_other_clips_record(thin) -> None:
    assert (
        thin.normalized_url("https://MEDIUM.com/@UdaykiranEstari/A-Post/")
        == "https://medium.com/@UdaykiranEstari/A-Post"
    )


def test_normalized_url_differs_from_the_indexs_answer_on_purpose(thin) -> None:
    url = "https://medium.com/@UdaykiranEstari/A-Post"
    assert thin.normalized_url(url) != thin.normalize(url)


@pytest.mark.parametrize(
    ("value", "expected"),
    [(None, "null"), (True, "true"), (False, "false"), ("a b", '"a b"'), (1, "1")],
)
def test_yaml_scalar_writes_what_build_frontmatter_writes(thin, value, expected) -> None:
    assert thin.yaml_scalar(value) == expected


def test_build_frontmatter_writes_the_canonical_key_order(thin) -> None:
    metadata = dict.fromkeys(thin.METADATA_ORDER, None)
    metadata["tags"] = ["ai"]
    metadata["asset_failures"] = []
    rendered = thin.build_frontmatter(metadata)
    keys = [line.split(":")[0] for line in rendered.splitlines() if not line.startswith((" ", "-"))]
    assert keys == list(thin.METADATA_ORDER)
    assert "asset_failures: []" in rendered
    assert 'tags:\n  - "ai"' in rendered


def test_build_frontmatter_puts_duplicate_of_last(thin) -> None:
    metadata = dict.fromkeys(thin.METADATA_ORDER, None)
    metadata["tags"] = []
    metadata["asset_failures"] = []
    metadata["duplicate_of"] = "OTHER"
    rendered = thin.build_frontmatter(metadata)
    assert rendered.splitlines()[-2] == 'duplicate_of: "OTHER"'


def test_build_metadata_marks_an_undeclared_capture_private(thin) -> None:
    metadata = thin.build_metadata(
        {
            "url": "https://medium.com/@a/x",
            "clipped_at": "t",
            "capture_source": "ios-shortcut",
            "note": "",
            "tags": [],
        },
        "ULID",
        {"title": "T", "url": "https://medium.com/@a/x", "author": "A", "body": "one two three"},
        "<html></html>",
    )
    assert metadata["sensitivity"] == "private"
    assert metadata["schema_version"] == 1
    assert metadata["word_count"] == 3
    assert metadata["snapshot_mode"] == "extracted"


def test_build_metadata_records_an_omitted_snapshot_when_there_is_no_html(thin) -> None:
    metadata = thin.build_metadata(
        {
            "url": "https://medium.com/@a/x",
            "clipped_at": "t",
            "capture_source": "s",
            "note": "",
            "tags": [],
        },
        "ULID",
        {"title": "T", "url": "", "author": None, "body": ""},
        "",
    )
    assert metadata["snapshot_mode"] == "omitted"
    assert metadata["canonical_url"] is None


def test_write_trio_omits_source_html_when_there_are_no_bytes(thin, tmp_path) -> None:
    clip = write_clip(tmp_path, "clips/pending/a")
    metadata = dict.fromkeys(thin.METADATA_ORDER, None)
    metadata["tags"] = []
    metadata["asset_failures"] = []
    thin.write_trio(clip, metadata, "body", "")
    assert not (clip / "source.html").exists()
    assert list(json.loads((clip / "metadata.json").read_text())) == list(thin.METADATA_ORDER)
    assert (clip / "index.md").read_text().endswith("body\n")


def test_a_duplicate_clip_gains_a_pointer_and_no_index_row(thin, tmp_path) -> None:
    url_index = load_capture_module("url_index")
    write_clip(
        tmp_path,
        "clips/pending/full",
        {
            "url": "https://medium.com/@Author/A-Post",
            "clip_id": "FULL",
            "title": "A post",
            "canonical_url": "https://medium.com/@Author/A-Post",
            "author": "Author",
        },
    )
    url_index.rebuild(tmp_path)
    clip = write_clip(tmp_path, "clips/pending/thin", files={"index.md": LEAKED_FRONTMATTER})
    connection = url_index.connect(tmp_path)

    message = thin.normalize_clip(clip, tmp_path, connection, dry_run=False)

    assert "duplicate of FULL" in message
    assert json.loads((clip / "metadata.json").read_text())["duplicate_of"] == "FULL"
    assert (
        connection.execute(
            load_sql("capture_normalize_thin_clip/select-captures-count")
        ).fetchone()[0]
        == 1
    )


def test_a_dry_run_reports_the_refetch_it_would_make_and_makes_none(thin, tmp_path) -> None:
    url_index = load_capture_module("url_index")
    clip = write_clip(tmp_path, "clips/pending/thin", files={"index.md": LEAKED_FRONTMATTER})
    connection = url_index.connect(tmp_path)
    message = thin.normalize_clip(clip, tmp_path, connection, dry_run=True)
    assert message == "  no capture of this URL - would refetch https://medium.com/@Author/A-Post"
    assert not (clip / "metadata.json").exists()


def test_a_refetched_clip_is_written_and_indexed(thin, tmp_path, monkeypatch) -> None:
    url_index = load_capture_module("url_index")
    monkeypatch.setattr(
        thin,
        "capture_article",
        lambda url: {
            "article": {"title": "A post", "url": url, "author": "Author", "body": "one two"},
            "html": "<html>body</html>",
        },
    )
    clip = write_clip(tmp_path, "clips/pending/thin", files={"index.md": LEAKED_FRONTMATTER})
    connection = url_index.connect(tmp_path)

    message = thin.normalize_clip(clip, tmp_path, connection, dry_run=False)

    assert "refetched 2 words" in message
    assert (clip / "source.html").read_text() == "<html>body</html>"
    row = connection.execute(
        load_sql("capture_normalize_thin_clip/select-captures-capture_id-clip_dir-title")
    ).fetchone()
    assert row[1:] == ("clips/pending/thin", "A post")


def test_capture_article_refuses_when_the_extractor_exits_non_zero(thin, monkeypatch) -> None:
    class Failed:
        returncode = 1
        stdout = ""
        stderr = "cloudflare said no\n"

    monkeypatch.setattr(thin.subprocess, "run", lambda *a, **k: Failed())
    with pytest.raises(thin.ThinClipError, match="cloudflare said no"):
        thin.capture_article("https://medium.com/@a/x")


def test_main_reports_nothing_to_do_on_a_repository_with_no_thin_clips(
    thin, tmp_path, monkeypatch, capsys
) -> None:
    write_clip(tmp_path, "clips/pending/a", {"url": "https://x/y"}, {"index.md": "---\n---\n"})
    monkeypatch.setattr(thin.sys, "argv", ["normalize_thin_clip.py", str(tmp_path)])
    assert thin.main() == 0
    assert capsys.readouterr().out == "no thin clips found\n"


def test_main_exits_non_zero_when_a_clip_is_refused(thin, tmp_path, monkeypatch, capsys) -> None:
    write_clip(
        tmp_path, "clips/pending/broken", files={"index.md": "---\ntitle: x\nurl: Imagen\n---\n"}
    )
    monkeypatch.setattr(thin.sys, "argv", ["normalize_thin_clip.py", "--dry-run", str(tmp_path)])
    assert thin.main() == 1
    captured = capsys.readouterr()
    assert "refused" in captured.err
    assert "dry run: nothing was fetched" in captured.out
