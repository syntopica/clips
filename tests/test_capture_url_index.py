"""The capture store's URL index: what counts as the same URL, and what a rebuild keeps.

`normalize` is the key every other capture tool looks a URL up by, so its
judgment calls - drop the query, keep YouTube's `v`, keep that value's case -
are the difference between a duplicate detected and an unrelated clip returned.
`rebuild` is the only writer that decides which directory wins for a URL.
"""

import json

import pytest

from tests.capture_modules import load_capture_module, write_clip
from tests.load_sql import load_sql


@pytest.fixture(scope="module")
def url_index():
    return load_capture_module("url_index")


def test_normalize_drops_query_fragment_and_trailing_slash(url_index) -> None:
    assert (
        url_index.normalize("https://Medium.com/@Author/Some-Post/?source=email#part-2")
        == "https://medium.com/@author/some-post"
    )


def test_normalize_lowercases_the_path_so_case_alone_is_not_two_captures(url_index) -> None:
    assert url_index.normalize("https://medium.com/@A/Post") == url_index.normalize(
        "https://medium.com/@a/post"
    )


def test_normalize_keeps_the_youtube_video_id_and_its_case(url_index) -> None:
    assert (
        url_index.normalize("https://www.youtube.com/watch?v=zmrPY6S1FwY&t=42s&si=abc")
        == "https://www.youtube.com/watch?v=zmrPY6S1FwY"
    )


def test_normalize_separates_two_youtube_videos(url_index) -> None:
    first = url_index.normalize("https://www.youtube.com/watch?v=aaaaaaaaaaa")
    second = url_index.normalize("https://www.youtube.com/watch?v=bbbbbbbbbbb")
    assert first != second


def test_normalize_falls_back_to_the_bare_path_when_the_video_id_is_absent(url_index) -> None:
    assert (
        url_index.normalize("https://www.youtube.com/watch?list=PL1")
        == "https://www.youtube.com/watch"
    )


def test_normalize_keeps_identity_parameters_only_on_the_listed_hosts(url_index) -> None:
    # youtu.be carries the id in the path, so its query is noise like anyone else's.
    assert url_index.normalize("https://youtu.be/zmrPY6S1FwY?t=5") == "https://youtu.be/zmrpy6s1fwy"


def test_read_metadata_answers_empty_for_a_clip_with_none(url_index, tmp_path) -> None:
    clip = write_clip(tmp_path, "clips/pending/a")
    assert url_index.read_metadata(clip) == {}


def test_read_metadata_answers_empty_rather_than_raising_on_corrupt_json(
    url_index, tmp_path
) -> None:
    clip = write_clip(tmp_path, "clips/pending/a")
    (clip / "metadata.json").write_text("{not json")
    assert url_index.read_metadata(clip) == {}


def test_clip_dirs_finds_directories_by_their_state_file(url_index, tmp_path) -> None:
    write_clip(tmp_path, "clips/pending/b")
    write_clip(tmp_path, "clips/processed/a")
    (tmp_path / "clips" / "pending" / "not-a-clip").mkdir()
    found = [path.name for path in url_index.clip_dirs(tmp_path)]
    assert found == ["b", "a"] or found == ["a", "b"]
    assert "not-a-clip" not in found


def test_rebuild_indexes_one_row_per_clip(url_index, tmp_path) -> None:
    write_clip(
        tmp_path,
        "clips/pending/one",
        {"url": "https://medium.com/@a/x", "clip_id": "ULID1", "title": "X"},
    )
    url_index.rebuild(tmp_path)
    connection = url_index.connect(tmp_path)
    row = connection.execute(
        load_sql("capture_url_index/select-captures-normalized_url-capture_id-clip_dir")
    ).fetchone()
    assert row == ("https://medium.com/@a/x", "ULID1", "clips/pending/one")


def test_rebuild_skips_a_clip_that_names_itself_a_duplicate(url_index, tmp_path) -> None:
    write_clip(
        tmp_path,
        "clips/pending/full",
        {"url": "https://medium.com/@a/x", "clip_id": "FULL"},
    )
    write_clip(
        tmp_path,
        "clips/pending/thin",
        {"url": "https://medium.com/@a/x", "clip_id": "THIN", "duplicate_of": "FULL"},
    )
    url_index.rebuild(tmp_path)
    connection = url_index.connect(tmp_path)
    rows = connection.execute(load_sql("capture_url_index/select-captures-capture_id")).fetchall()
    assert rows == [("FULL",)]


def test_rebuild_reads_the_camel_case_spellings_the_older_clips_carry(url_index, tmp_path) -> None:
    write_clip(
        tmp_path,
        "clips/pending/old",
        {
            "url": "https://medium.com/@a/x",
            "clip_id": "OLD",
            "contentSha256": "deadbeef",
            "capturedAt": "2026-07-01T00:00:00Z",
        },
    )
    url_index.rebuild(tmp_path)
    connection = url_index.connect(tmp_path)
    row = connection.execute(
        load_sql("capture_url_index/select-captures-content_sha-captured_at")
    ).fetchone()
    assert row == ("deadbeef", "2026-07-01T00:00:00Z")


def test_rebuild_names_a_clip_by_its_directory_when_metadata_has_no_id(url_index, tmp_path) -> None:
    write_clip(tmp_path, "clips/pending/dir-name", {"url": "https://medium.com/@a/x"})
    url_index.rebuild(tmp_path)
    connection = url_index.connect(tmp_path)
    assert connection.execute(
        load_sql("capture_url_index/select-captures-capture_id")
    ).fetchone() == ("dir-name",)


def test_rebuild_ignores_a_clip_with_no_url_at_all(url_index, tmp_path) -> None:
    write_clip(tmp_path, "clips/pending/empty", {"title": "no url here"})
    url_index.rebuild(tmp_path)
    connection = url_index.connect(tmp_path)
    assert (
        connection.execute(load_sql("capture_url_index/select-captures-count")).fetchone()[0] == 0
    )


def test_rebuild_forgets_a_capture_whose_directory_is_gone(url_index, tmp_path) -> None:
    clip = write_clip(tmp_path, "clips/pending/one", {"url": "https://medium.com/@a/x"})
    url_index.rebuild(tmp_path)
    (clip / "state.json").unlink()
    url_index.rebuild(tmp_path)
    connection = url_index.connect(tmp_path)
    assert (
        connection.execute(load_sql("capture_url_index/select-captures-count")).fetchone()[0] == 0
    )


def test_lookup_prints_the_capture_and_its_directory(url_index, tmp_path, capsys) -> None:
    write_clip(tmp_path, "clips/pending/one", {"url": "https://medium.com/@a/x", "clip_id": "U1"})
    url_index.rebuild(tmp_path)
    capsys.readouterr()
    url_index.lookup(tmp_path, "https://medium.com/@a/x/?source=rss")
    assert capsys.readouterr().out == "U1\tclips/pending/one\n"


def test_lookup_prints_nothing_for_a_url_the_store_has_never_seen(
    url_index, tmp_path, capsys
) -> None:
    url_index.connect(tmp_path)
    capsys.readouterr()
    url_index.lookup(tmp_path, "https://medium.com/@a/unseen")
    assert capsys.readouterr().out == ""


def test_main_without_a_command_prints_the_usage_and_fails(url_index, monkeypatch, capsys) -> None:
    monkeypatch.setattr(url_index.sys, "argv", ["url_index.py"])
    assert url_index.main() == 2
    assert "Usage:" in capsys.readouterr().out


def test_main_rejects_an_unknown_command(url_index, monkeypatch, capsys) -> None:
    monkeypatch.setattr(url_index.sys, "argv", ["url_index.py", "vacuum"])
    assert url_index.main() == 2
    assert "Usage:" in capsys.readouterr().out


def test_main_takes_the_repository_from_the_second_operand(
    url_index, monkeypatch, tmp_path, capsys
) -> None:
    write_clip(tmp_path, "clips/pending/one", {"url": "https://medium.com/@a/x"})
    monkeypatch.setattr(url_index.sys, "argv", ["url_index.py", "rebuild", str(tmp_path)])
    assert url_index.main() == 0
    assert "indexed 1 captures" in capsys.readouterr().out
    assert (tmp_path / url_index.INDEX_NAME).exists()


def test_main_lookup_takes_the_repository_after_the_url(
    url_index, monkeypatch, tmp_path, capsys
) -> None:
    write_clip(tmp_path, "clips/pending/one", {"url": "https://medium.com/@a/x", "clip_id": "U1"})
    url_index.rebuild(tmp_path)
    monkeypatch.setattr(
        url_index.sys,
        "argv",
        ["url_index.py", "lookup", "https://medium.com/@a/x", str(tmp_path)],
    )
    capsys.readouterr()
    assert url_index.main() == 0
    assert capsys.readouterr().out == "U1\tclips/pending/one\n"


def test_stats_counts_every_table_it_names(url_index, tmp_path, capsys) -> None:
    write_clip(tmp_path, "clips/pending/one", {"url": "https://medium.com/@a/x"})
    url_index.rebuild(tmp_path)
    connection = url_index.connect(tmp_path)
    connection.execute(
        load_sql("capture_url_index/insert-assets"), ("s", "https://cdn/i.png", "c", 9, "ok")
    )
    connection.commit()
    capsys.readouterr()
    url_index.stats(tmp_path)
    printed = capsys.readouterr().out
    assert "captures: 1" in printed
    assert "assets recorded: 1" in printed
    assert "assets failed: 0" in printed


def test_connect_creates_the_schema_in_an_empty_repository(url_index, tmp_path) -> None:
    connection = url_index.connect(tmp_path)
    tables = {
        row[0]
        for row in connection.execute(load_sql("capture_url_index/select-sqlite-master-name"))
    }
    assert {"captures", "assets", "unavailable"} <= tables


def test_read_metadata_returns_the_parsed_object(url_index, tmp_path) -> None:
    clip = write_clip(tmp_path, "clips/pending/a", {"url": "https://x/y"})
    assert url_index.read_metadata(clip)["url"] == "https://x/y"
    assert json.loads((clip / "metadata.json").read_text())["url"] == "https://x/y"
