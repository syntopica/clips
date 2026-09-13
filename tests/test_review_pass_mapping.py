"""Review pass: mapping."""

from tests.review_pass_brain import _brain
from tests.review_pass_entry import _entry
from tests.review_pass_map_to_clips import map_to_clips
from tests.review_pass_other import OTHER
from tests.review_pass_post import POST
from tests.review_pass_url_index import _url_index

__all__ = ["map_to_clips"]


def test_a_captured_entry_the_wiki_cites_is_marked_both_ways(map_to_clips) -> None:
    rows = [_entry("r0001", f"https://medium.com/@a/piece-{POST}")]
    map_to_clips.annotate(rows, {POST}, {POST: "clips/processed/xyz"})
    assert (rows[0]["post_id"], rows[0]["in_wiki"], rows[0]["bucket"]) == (POST, True, "processed")


def test_an_entry_with_no_clip_is_bucketed_uncaptured(map_to_clips) -> None:
    rows = [_entry("r0001", f"https://medium.com/@a/piece-{POST}")]
    map_to_clips.annotate(rows, set(), {})
    assert (rows[0]["clip_dir"], rows[0]["bucket"]) == ("", "uncaptured")


def test_a_url_without_a_post_id_is_never_matched(map_to_clips) -> None:
    rows = [_entry("r0001", "https://example.com/no-hex-suffix")]
    map_to_clips.annotate(rows, {POST}, {POST: "clips/pending/xyz"})
    assert (rows[0]["post_id"], rows[0]["in_wiki"], rows[0]["bucket"]) == ("", False, "uncaptured")


def test_the_bucket_is_the_second_segment_of_the_clip_directory(map_to_clips) -> None:
    rows = [_entry("r0001", f"https://medium.com/@a/piece-{POST}")]
    map_to_clips.annotate(rows, set(), {POST: "clips/pending/2026/xyz"})
    assert rows[0]["bucket"] == "pending"


def test_the_capture_ledger_is_keyed_by_post_id_not_by_url(map_to_clips, tmp_path) -> None:
    _url_index(tmp_path, [(f"https://medium.com/@a/piece-{POST}", "clips/pending/xyz")])
    assert map_to_clips.captured(tmp_path) == {POST: "clips/pending/xyz"}


def test_two_spellings_of_one_post_collapse_to_one_clip(map_to_clips, tmp_path) -> None:
    _url_index(
        tmp_path,
        [
            (f"https://medium.com/@a/piece-{POST}", "clips/pending/first"),
            (f"https://towardsdatascience.medium.com/other-title-{POST}", "clips/pending/second"),
        ],
    )
    assert map_to_clips.captured(tmp_path) == {POST: "clips/pending/second"}


def test_a_ledger_row_with_no_post_id_is_ignored(map_to_clips, tmp_path) -> None:
    _url_index(tmp_path, [("https://example.com/plain", "clips/pending/xyz")])
    assert map_to_clips.captured(tmp_path) == {}


def test_only_page_directories_count_as_a_wiki_citation(map_to_clips, tmp_path) -> None:
    brain = _brain(
        tmp_path,
        {
            "topics/a.md": f"cited: https://medium.com/@a/piece-{POST}\n",
            "sources/newsletter-triage/x.md": f"harvested: https://medium.com/@a/o-{OTHER}\n",
        },
    )
    assert map_to_clips.wiki_post_ids(brain) == {POST}


def test_a_wiki_with_no_medium_citation_yields_no_ids(map_to_clips, tmp_path) -> None:
    assert map_to_clips.wiki_post_ids(_brain(tmp_path, {"topics/a.md": "no links here\n"})) == set()
