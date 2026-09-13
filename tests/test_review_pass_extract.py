"""Review pass: extract."""

import json

from tests.review_pass_extract_entries import extract_entries
from tests.review_pass_review_record import REVIEW_RECORD

__all__ = ["extract_entries"]


def test_only_the_review_bucket_is_extracted(extract_entries, tmp_path) -> None:
    source = tmp_path / "not-ingested.md"
    source.write_text(REVIEW_RECORD)
    rows = extract_entries.extract(source)
    assert [row["url"] for row in rows] == [
        "https://example.com/a",
        "https://example.com/b",
    ]


def test_a_wrapped_note_is_kept_with_its_entry(extract_entries, tmp_path) -> None:
    source = tmp_path / "not-ingested.md"
    source.write_text(REVIEW_RECORD)
    rows = extract_entries.extract(source)
    assert rows[1]["note"] == "that wrapped onto another line"


def test_every_entry_carries_its_topic_and_an_id(extract_entries, tmp_path) -> None:
    source = tmp_path / "not-ingested.md"
    source.write_text(REVIEW_RECORD)
    rows = extract_entries.extract(source)
    assert [(row["id"], row["topic"]) for row in rows] == [("r0001", "ai"), ("r0002", "ai")]


def test_the_extracted_record_round_trips_as_jsonl(extract_entries, tmp_path) -> None:
    source = tmp_path / "not-ingested.md"
    source.write_text(REVIEW_RECORD)
    rows = extract_entries.extract(source)
    line = json.dumps(rows[0], ensure_ascii=False)
    assert json.loads(line)["title"] == "First piece"
