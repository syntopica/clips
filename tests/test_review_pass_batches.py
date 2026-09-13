"""Review pass: batches."""

from tests.review_pass_build_batches import build_batches
from tests.review_pass_clip import _clip

__all__ = ["build_batches"]


def _row(row_id: str, **overrides) -> dict:
    row = {
        "id": row_id,
        "title": f"title {row_id}",
        "topic": "ai",
        "in_wiki": False,
        "bucket": "pending",
        "clip_dir": f"clips/pending/{row_id}",
    }
    row.update(overrides)
    return row


def test_an_entry_the_wiki_already_cites_is_not_a_candidate(build_batches, tmp_path) -> None:
    _clip(tmp_path, "clips/pending/a", "body")
    assert build_batches.select_candidates([_row("a", in_wiki=True)], tmp_path) == []


def test_an_uncaptured_entry_is_not_a_candidate(build_batches, tmp_path) -> None:
    rows = [_row("a", bucket="uncaptured")]
    assert build_batches.select_candidates(rows, tmp_path) == []


def test_an_entry_whose_clip_is_missing_is_dropped(build_batches, tmp_path) -> None:
    assert build_batches.select_candidates([_row("a")], tmp_path) == []


def test_a_candidate_carries_its_clip_body(build_batches, tmp_path) -> None:
    _clip(tmp_path, "clips/pending/a", "---\ntitle: x\n---\n\nThe actual prose.\n")
    candidates = build_batches.select_candidates([_row("a")], tmp_path)
    assert [row["body"] for row in candidates] == ["The actual prose."]


def test_the_body_is_cut_to_the_readable_opening(build_batches, tmp_path) -> None:
    _clip(tmp_path, "clips/pending/a", "word " * 1000)
    candidates = build_batches.select_candidates([_row("a")], tmp_path)
    assert len(candidates[0]["body"]) == build_batches.BODY_CHARS


def test_batches_are_rewritten_not_appended_to(build_batches, tmp_path) -> None:
    batches = tmp_path / "batches"
    batches.mkdir()
    (batches / "batch-99.txt").write_text("from an earlier run\n")
    build_batches.write_batches([_row("a") | {"body": "b"}], batches)
    assert sorted(path.name for path in batches.glob("*.txt")) == ["batch-00.txt"]


def test_batches_hold_at_most_the_batch_size(build_batches, tmp_path) -> None:
    rows = [_row(f"r{index}") | {"body": "b"} for index in range(build_batches.BATCH + 1)]
    build_batches.write_batches(rows, tmp_path / "batches")
    written = sorted((tmp_path / "batches").glob("*.txt"))
    assert [path.name for path in written] == ["batch-00.txt", "batch-01.txt"]
