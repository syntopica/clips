"""Review pass: main."""

import json

from tests.fixtures.make_data_directory import make_data_directory
from tests.review_pass_brain import _brain
from tests.review_pass_build_batches import build_batches
from tests.review_pass_clip import _clip
from tests.review_pass_entry import _entry
from tests.review_pass_extract_entries import extract_entries
from tests.review_pass_judged import _judged
from tests.review_pass_map_to_clips import map_to_clips
from tests.review_pass_mapped import _mapped
from tests.review_pass_other import OTHER
from tests.review_pass_post import POST
from tests.review_pass_review_record import REVIEW_RECORD
from tests.review_pass_url_index import _url_index

__all__ = ["build_batches", "extract_entries", "map_to_clips"]


def test_extract_main_writes_one_json_object_per_line(extract_entries, tmp_path) -> None:
    source = tmp_path / "not-ingested.md"
    source.write_text(REVIEW_RECORD)
    out = tmp_path / "review.jsonl"
    assert extract_entries.main(["extract", str(source), str(out)]) == 0
    lines = out.read_text().splitlines()
    assert [json.loads(line)["id"] for line in lines] == ["r0001", "r0002"]


def test_build_main_writes_the_candidates_beside_the_batches(build_batches, tmp_path) -> None:
    clips = tmp_path / "clips-store"
    _clip(clips, "clips/pending/a", "The actual prose.")
    mapped = _mapped(tmp_path, [_judged("a", clip_dir="clips/pending/a"), _judged("b")])
    work = tmp_path / "work"
    work.mkdir()
    assert build_batches.main(["build", str(mapped), str(work), str(clips)]) == 0
    written = (work / "batches" / "batch-00.txt").read_text()
    assert "### a" in written and "### b" not in written
    assert (
        json.loads((work / "candidates.jsonl").read_text().strip())["body"] == "The actual prose."
    )


def test_build_main_falls_back_to_the_default_clip_store(build_batches, tmp_path, monkeypatch):
    data = make_data_directory(tmp_path / "instance")
    monkeypatch.setenv("SYNTOPICA_DATA", str(data))
    _clip(data / "clips", "clips/pending/a", "prose")
    mapped = _mapped(tmp_path, [_judged("a", clip_dir="clips/pending/a")])
    work = tmp_path / "work"
    work.mkdir()
    assert build_batches.main(["build", str(mapped), str(work)]) == 0
    assert "### a" in (work / "batches" / "batch-00.txt").read_text()


def test_map_main_annotates_against_the_stores_it_is_given(map_to_clips, tmp_path) -> None:
    brain = _brain(tmp_path / "brain", {"topics/a.md": f"https://medium.com/@a/piece-{POST}\n"})
    clips = tmp_path / "clips-store"
    clips.mkdir()
    _url_index(clips, [(f"https://medium.com/@a/other-{OTHER}", "clips/pending/xyz")])
    source = _mapped(
        tmp_path,
        [
            _entry("r0001", f"https://medium.com/@a/piece-{POST}"),
            _entry("r0002", f"https://medium.com/@a/other-{OTHER}"),
            _entry("r0003", "https://example.com/plain"),
        ],
    )
    out = tmp_path / "review-mapped.jsonl"
    assert map_to_clips.main(["map", str(source), str(out), str(brain), str(clips)]) == 0
    rows = [json.loads(line) for line in out.read_text().splitlines()]
    assert [(row["in_wiki"], row["bucket"]) for row in rows] == [
        (True, "uncaptured"),
        (False, "pending"),
        (False, "uncaptured"),
    ]
