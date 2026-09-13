"""Verdicts: importing them from triage markdown, selecting a batch, recording a reading pass.

The failure this covers is the one the import already had once - a second line
shape in the triage files silently dropped every rejected entry - plus the
determinism `record_reading.py` leans on to reconstruct a batch it kept no
manifest for.
"""

import json

import pytest

from tests.capture_modules import load_capture_module, write_clip

TRIAGE = """# Newsletter triage

## Ingest

- [x] [A kept post](https://medium.com/@a/kept) - worth reading
- [A bare ingest line](https://medium.com/@a/bare) - no marker at all

## Review

- [ ] [Deferred](https://medium.com/@a/deferred) - later

## Rejected

- [A rejected post](https://medium.com/@a/rejected) - not for us
- [gone-410] [Deleted upstream](https://medium.com/@a/gone) - publisher removed it

Not an entry line at all.
"""


@pytest.fixture(scope="module")
def classifications():
    return load_capture_module("classifications")


@pytest.fixture(scope="module")
def read_batch():
    return load_capture_module("read_batch")


@pytest.fixture(scope="module")
def record_reading():
    return load_capture_module("record_reading")


def _triage(tmp_path):
    triage_dir = tmp_path / "triage" / "2026-07-29"
    triage_dir.mkdir(parents=True)
    (triage_dir / "ai-engineering.md").write_text(TRIAGE)
    (triage_dir / "README.md").write_text("- [x] [Ignored](https://x/y) - a readme\n")
    (triage_dir / "NOT-INGESTED.md").write_text("- [x] [Ignored](https://x/z) - a list\n")
    return tmp_path / "triage"


def _verdicts(repo):
    path = repo / "classifications" / "2026-07-29" / "run-zero-triage-import.jsonl"
    return [json.loads(line) for line in path.read_text().splitlines() if line.strip()]


def test_bucket_for_lets_a_lines_own_marker_beat_the_heading(classifications) -> None:
    assert classifications.bucket_for("[gone-410]", "ingest") == "unavailable"
    assert classifications.bucket_for("", "rejected") == "rejected"
    assert classifications.bucket_for("[unknown]", "review") == "review"


def test_the_entry_pattern_reads_both_line_shapes(classifications) -> None:
    marked = classifications.ENTRY.match("- [x] [Title](https://a/b) - reason")
    bare = classifications.ENTRY.match("- [Title](https://a/b) - reason")
    assert marked.groups() == ("[x]", "Title", "https://a/b")
    assert bare.groups() == (None, "Title", "https://a/b")


def test_an_unmarked_rejected_line_is_imported_rather_than_dropped(
    classifications, tmp_path
) -> None:
    classifications.import_triage(tmp_path, _triage(tmp_path))
    buckets = {row["normalized_url"]: row["bucket"] for row in _verdicts(tmp_path)}
    assert buckets["https://medium.com/@a/rejected"] == "rejected"
    assert buckets["https://medium.com/@a/bare"] == "ingest"


def test_the_marker_overrides_the_section_it_sits_in(classifications, tmp_path) -> None:
    classifications.import_triage(tmp_path, _triage(tmp_path))
    buckets = {row["normalized_url"]: row["bucket"] for row in _verdicts(tmp_path)}
    assert buckets["https://medium.com/@a/gone"] == "unavailable"
    assert buckets["https://medium.com/@a/deferred"] == "review"


def test_the_import_skips_the_index_files(classifications, tmp_path) -> None:
    classifications.import_triage(tmp_path, _triage(tmp_path))
    assert all("x/y" not in row["normalized_url"] for row in _verdicts(tmp_path))
    assert len(_verdicts(tmp_path)) == 5


def test_every_verdict_names_the_topic_file_it_came_from(classifications, tmp_path) -> None:
    classifications.import_triage(tmp_path, _triage(tmp_path))
    assert {row["topic"] for row in _verdicts(tmp_path)} == {"ai-engineering"}


def test_a_verdict_carries_the_capture_id_when_the_url_is_already_captured(
    classifications, tmp_path
) -> None:
    url_index = load_capture_module("url_index")
    write_clip(
        tmp_path, "clips/pending/one", {"url": "https://medium.com/@a/kept", "clip_id": "CAP1"}
    )
    url_index.rebuild(tmp_path)
    classifications.import_triage(tmp_path, _triage(tmp_path))
    by_url = {row["normalized_url"]: row for row in _verdicts(tmp_path)}
    assert by_url["https://medium.com/@a/kept"]["capture_id"] == "CAP1"
    assert by_url["https://medium.com/@a/deferred"]["capture_id"] is None


def test_latest_lets_a_newer_run_overwrite_an_older_verdict(
    classifications, tmp_path, capsys
) -> None:
    runs = tmp_path / "classifications"
    for date, bucket in (("2026-07-29", "review"), ("2026-08-04", "ingest")):
        (runs / date).mkdir(parents=True)
        (runs / date / "run.jsonl").write_text(
            json.dumps({"normalized_url": "https://a/x", "bucket": bucket, "topic": "t"}) + "\n"
        )
    capsys.readouterr()
    classifications.latest(tmp_path, None)
    captured = capsys.readouterr()
    assert "ingest" in captured.out
    assert "review" not in captured.out
    assert "1 of 1 verdicts" in captured.err


def test_latest_filters_to_one_bucket_but_still_counts_them_all(
    classifications, tmp_path, capsys
) -> None:
    runs = tmp_path / "classifications" / "2026-07-29"
    runs.mkdir(parents=True)
    runs.joinpath("run.jsonl").write_text(
        "\n".join(
            json.dumps({"normalized_url": f"https://a/{n}", "bucket": bucket, "topic": "t"})
            for n, bucket in enumerate(("ingest", "review"))
        )
        + "\n"
    )
    capsys.readouterr()
    classifications.latest(tmp_path, "ingest")
    captured = capsys.readouterr()
    assert "1 of 2 verdicts" in captured.err


def test_runs_reports_the_verdict_count_per_file(classifications, tmp_path, capsys) -> None:
    runs = tmp_path / "classifications" / "2026-07-29"
    runs.mkdir(parents=True)
    runs.joinpath("run.jsonl").write_text('{"a": 1}\n\n{"a": 2}\n')
    capsys.readouterr()
    classifications.runs(tmp_path)
    assert capsys.readouterr().out == "2026-07-29/run.jsonl\t2 verdicts\n"


def test_prompt_hash_identifies_a_prompt(classifications) -> None:
    assert classifications.prompt_hash("a") != classifications.prompt_hash("b")
    assert len(classifications.prompt_hash("a")) == 64


def test_classifications_main_without_arguments_prints_the_usage(
    classifications, monkeypatch, capsys
) -> None:
    monkeypatch.setattr(classifications.sys, "argv", ["classifications.py"])
    assert classifications.main() == 2
    assert "Usage:" in capsys.readouterr().out


def _batch_repo(tmp_path):
    url_index = load_capture_module("url_index")
    for name, url in (("a", "https://a/1"), ("b", "https://a/2"), ("c", "https://a/3")):
        write_clip(
            tmp_path,
            f"clips/pending/{name}",
            {"url": url, "clip_id": name.upper()},
            {"index.md": f"Body of {name}."},
        )
    url_index.rebuild(tmp_path)
    runs = tmp_path / "classifications" / "2026-08-01"
    runs.mkdir(parents=True)
    runs.joinpath("run.jsonl").write_text(
        "\n".join(
            json.dumps({"normalized_url": url, "bucket": bucket})
            for url, bucket in (("https://a/1", "ingest"), ("https://a/2", "ingest"))
        )
        + "\n"
    )
    return tmp_path


def test_select_returns_one_bucket_ordered_by_url(read_batch, tmp_path) -> None:
    repo = _batch_repo(tmp_path)
    assert read_batch.select(repo, "ingest", 0, 10) == [
        ("https://a/1", "clips/pending/a"),
        ("https://a/2", "clips/pending/b"),
    ]


def test_select_treats_an_unclassified_capture_as_unknown(read_batch, tmp_path) -> None:
    repo = _batch_repo(tmp_path)
    assert read_batch.select(repo, "unknown", 0, 10) == [("https://a/3", "clips/pending/c")]


def test_successive_offsets_do_not_overlap(read_batch, tmp_path) -> None:
    repo = _batch_repo(tmp_path)
    first = read_batch.select(repo, "ingest", 0, 1)
    second = read_batch.select(repo, "ingest", 1, 1)
    assert first != second
    assert set(first).isdisjoint(second)


def test_latest_verdicts_lets_the_last_run_file_win(read_batch, tmp_path) -> None:
    for date, bucket in (("2026-07-01", "review"), ("2026-08-01", "ingest")):
        runs = tmp_path / "classifications" / date
        runs.mkdir(parents=True)
        runs.joinpath("run.jsonl").write_text(
            json.dumps({"normalized_url": "https://a/1", "bucket": bucket}) + "\n"
        )
    assert read_batch.latest_verdicts(tmp_path) == {"https://a/1": "ingest"}


def test_read_batch_truncates_a_long_article_rather_than_the_batch(
    read_batch, tmp_path, monkeypatch, capsys
) -> None:
    repo = _batch_repo(tmp_path)
    (repo / "clips" / "pending" / "a" / "index.md").write_text(
        "x" * (read_batch.MAX_ARTICLE_CHARS + 50)
    )
    output = tmp_path / "batch.txt"
    monkeypatch.setattr(read_batch, "default_capture_archive", lambda: repo)
    monkeypatch.setattr(read_batch.sys, "argv", ["read_batch.py", "ingest", "0", "10", str(output)])
    assert read_batch.main() == 0
    written = output.read_text()
    assert "[truncated]" in written
    assert "Body of b." in written
    assert "2 articles" in capsys.readouterr().out


def test_read_batch_main_rejects_the_wrong_number_of_operands(
    read_batch, monkeypatch, capsys
) -> None:
    monkeypatch.setattr(read_batch.sys, "argv", ["read_batch.py", "ingest"])
    assert read_batch.main() == 2
    assert "Usage:" in capsys.readouterr().out


def test_kept_from_takes_the_first_bulleted_line_of_each_section(record_reading, tmp_path) -> None:
    findings = tmp_path / "f.md"
    findings.write_text(
        "### https://a/1\n\nsome prose\n- What is worth keeping: the eval harness\n- second point\n"
    )
    assert record_reading.kept_from(findings) == {
        "https://a/1": "What is worth keeping: the eval harness"
    }


def test_kept_from_records_a_section_with_no_detail_rather_than_skipping_it(
    record_reading, tmp_path
) -> None:
    findings = tmp_path / "f.md"
    findings.write_text("### https://a/1\n\njust prose\n")
    assert record_reading.kept_from(findings) == {"https://a/1": "kept, no detail recorded"}


def test_drops_from_is_empty_when_no_reasons_file_exists(record_reading, tmp_path) -> None:
    assert record_reading.drops_from(tmp_path / "absent.md") == {}


def test_drops_from_reads_a_url_and_its_reason(record_reading, tmp_path) -> None:
    dropped = tmp_path / "d.md"
    dropped.write_text("- https://a/2 - marketing, no method\n- https://a/3 — em dash also works\n")
    assert record_reading.drops_from(dropped) == {
        "https://a/2": "marketing, no method",
        "https://a/3": "em dash also works",
    }


def test_recording_a_reading_pass_writes_both_the_keeps_and_the_drops(
    record_reading, tmp_path, monkeypatch, capsys
) -> None:
    repo = _batch_repo(tmp_path)
    findings_dir = tmp_path / "findings"
    findings_dir.mkdir()
    (findings_dir / "ingest-b1-findings.md").write_text(
        "### https://a/1\n\n- What is worth keeping: the eval harness\n"
    )
    (findings_dir / "ingest-b1-dropped.md").write_text("- https://a/2 - marketing, no method\n")
    monkeypatch.setattr(record_reading, "default_capture_archive", lambda: repo)
    monkeypatch.setattr(
        record_reading.sys,
        "argv",
        ["record_reading.py", "ingest", "2", str(findings_dir), "2026-08-10"],
    )

    assert record_reading.main() == 0

    rows = [
        json.loads(line)
        for line in (repo / "classifications" / "2026-08-10" / "full-text-read-ingest.jsonl")
        .read_text()
        .splitlines()
    ]
    assert {row["normalized_url"]: row["bucket"] for row in rows} == {
        "https://a/1": "ingest",
        "https://a/2": "read-no-value",
    }
    assert "1 kept, 1 dropped" in capsys.readouterr().out


def test_a_drop_with_no_recorded_reason_is_counted_rather_than_hidden(
    record_reading, tmp_path, monkeypatch, capsys
) -> None:
    repo = _batch_repo(tmp_path)
    findings_dir = tmp_path / "findings"
    findings_dir.mkdir()
    (findings_dir / "ingest-b1-findings.md").write_text("### https://a/1\n\n- kept it\n")
    monkeypatch.setattr(record_reading, "default_capture_archive", lambda: repo)
    monkeypatch.setattr(
        record_reading.sys,
        "argv",
        ["record_reading.py", "ingest", "2", str(findings_dir), "2026-08-10"],
    )

    assert record_reading.main() == 0

    rows = [
        json.loads(line)
        for line in (repo / "classifications" / "2026-08-10" / "full-text-read-ingest.jsonl")
        .read_text()
        .splitlines()
    ]
    dropped = next(row for row in rows if row["bucket"] == "read-no-value")
    assert dropped["reason"] == "read in full, nothing kept (reason not recorded)"
    assert "1 drops carry no recorded reason" in capsys.readouterr().out
