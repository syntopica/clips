"""Publishing the local index to the capture service, with the transport stubbed out.

The two things that would break silently are the bucket-to-state mapping - a
wrong state sends `clips drain` off to re-promote the whole archive - and the
timestamp, which dates a July clip in August when the service is left to stamp
it itself.
"""

import json

import pytest

from tests.capture_modules import load_capture_module, write_clip
from tests.load_sql import load_sql


@pytest.fixture(scope="module")
def push_module():
    return load_capture_module("push_index_to_service")


@pytest.mark.parametrize(
    ("clip_dir", "expected"),
    [
        ("clips/pending/a", "captured"),
        ("clips/processed/a", "ingested"),
        ("clips/needs-claude/a", "needs-claude"),
        ("clips/quarantine/a", None),
        ("pending/a", None),
    ],
)
def test_state_for_reads_the_bucket_and_nothing_else(push_module, clip_dir, expected) -> None:
    assert push_module.state_for(clip_dir) == expected


def test_clipped_at_prefers_the_clips_own_timestamp(push_module, tmp_path) -> None:
    write_clip(tmp_path, "clips/pending/2026-07-15-a", {"clipped_at": "2026-07-15T09:30:00Z"})
    assert push_module.clipped_at(tmp_path, "clips/pending/2026-07-15-a") == "2026-07-15T09:30:00Z"


def test_clipped_at_falls_back_to_the_date_in_the_directory_name(push_module, tmp_path) -> None:
    write_clip(tmp_path, "clips/pending/2026-07-15-a")
    assert push_module.clipped_at(tmp_path, "clips/pending/2026-07-15-a") == "2026-07-15T00:00:00Z"


def test_clipped_at_survives_a_corrupt_metadata_file(push_module, tmp_path) -> None:
    clip = write_clip(tmp_path, "clips/pending/2026-07-15-a")
    (clip / "metadata.json").write_text("{oops")
    assert push_module.clipped_at(tmp_path, "clips/pending/2026-07-15-a") == "2026-07-15T00:00:00Z"


def test_clipped_at_is_empty_when_neither_source_carries_a_date(push_module, tmp_path) -> None:
    write_clip(tmp_path, "clips/pending/no-date-here")
    assert push_module.clipped_at(tmp_path, "clips/pending/no-date-here") == ""


def test_push_records_the_capture_then_patches_its_state(
    push_module, tmp_path, monkeypatch
) -> None:
    calls = []

    def fake_call(service, path, method, payload):
        calls.append((service.origin, path, method, payload))
        return {"data": {"capture_id": "cap-1"}}

    monkeypatch.setattr(push_module, "call", fake_call)
    write_clip(tmp_path, "clips/pending/2026-07-15-a", {"clipped_at": "2026-07-15T09:30:00Z"})

    push_module.push(
        push_module.Service("https://service", "token"),
        tmp_path,
        "https://medium.com/@a/x",
        "clips/pending/2026-07-15-a",
        "captured",
    )

    assert calls[0][1:] == (
        "/api/capture",
        "POST",
        {
            "url": "https://medium.com/@a/x",
            "capture_source": "mac-backfill",
            "captured_at": "2026-07-15T09:30:00Z",
        },
    )
    assert calls[1][1:] == (
        "/api/captures/cap-1",
        "PATCH",
        {"state": "captured", "clip_dir": "clips/pending/2026-07-15-a"},
    )


def test_push_refuses_when_the_service_returns_no_capture_id(
    push_module, tmp_path, monkeypatch
) -> None:
    monkeypatch.setattr(push_module, "call", lambda *a: {"data": {}})
    with pytest.raises(ValueError, match="no capture id"):
        push_module.push(
            push_module.Service("https://service", "token"),
            tmp_path,
            "https://medium.com/@a/x",
            "clips/pending/a",
            "captured",
        )


def _index(tmp_path, rows) -> None:
    connection = load_capture_module("url_index").connect(tmp_path)
    connection.executemany(
        load_sql("capture_push_index_to_service/insert-captures"),
        [
            (url, url, f"c{n}", clip_dir, None, None, captured_at, "captured")
            for n, (url, clip_dir, captured_at) in enumerate(rows)
        ],
    )
    connection.commit()


def test_rows_to_push_reads_the_index_in_capture_order(push_module, tmp_path) -> None:
    _index(
        tmp_path,
        [
            ("https://b", "clips/pending/b", "2026-08-01"),
            ("https://a", "clips/pending/a", "2026-07-01"),
        ],
    )
    assert push_module.rows_to_push(tmp_path, 0) == [
        ("https://a", "clips/pending/a"),
        ("https://b", "clips/pending/b"),
    ]


def test_rows_to_push_honours_a_limit(push_module, tmp_path) -> None:
    _index(
        tmp_path,
        [
            ("https://a", "clips/pending/a", "2026-07-01"),
            ("https://b", "clips/pending/b", "2026-08-01"),
        ],
    )
    assert push_module.rows_to_push(tmp_path, 1) == [("https://a", "clips/pending/a")]


def test_main_refuses_a_real_run_with_no_token(push_module, tmp_path, monkeypatch, capsys) -> None:
    monkeypatch.delenv("CAPTURE_TOKEN", raising=False)
    monkeypatch.setattr(
        push_module.sys,
        "argv",
        ["push.py", "--repo", str(tmp_path), "--origin", "https://capture.example"],
    )
    assert push_module.main() == 2
    assert "CAPTURE_TOKEN is not set" in capsys.readouterr().err


def test_a_dry_run_needs_no_token_and_makes_no_request(
    push_module, tmp_path, monkeypatch, capsys
) -> None:
    def refuse(*args, **kwargs):
        raise AssertionError("a dry run must not call the service")

    monkeypatch.delenv("CAPTURE_TOKEN", raising=False)
    monkeypatch.setattr(push_module, "call", refuse)
    _index(
        tmp_path,
        [
            ("https://a", "clips/pending/a", "2026-07-01"),
            ("https://b", "clips/quarantine/b", "2026-07-02"),
        ],
    )
    monkeypatch.setattr(
        push_module.sys,
        "argv",
        ["push.py", "--repo", str(tmp_path), "--origin", "https://capture.example", "--dry-run"],
    )
    assert push_module.main() == 0
    assert "pushed 1, skipped 1, failed 0 of 2" in capsys.readouterr().out


def test_main_reports_a_failed_row_and_exits_non_zero(
    push_module, tmp_path, monkeypatch, capsys
) -> None:
    monkeypatch.setenv("CAPTURE_TOKEN", "not-a-real-token")
    monkeypatch.setattr(
        push_module, "call", lambda *a: (_ for _ in ()).throw(json.JSONDecodeError("bad", "", 0))
    )
    _index(tmp_path, [("https://a", "clips/pending/a", "2026-07-01")])
    monkeypatch.setattr(
        push_module.sys,
        "argv",
        ["push.py", "--repo", str(tmp_path), "--origin", "https://capture.example"],
    )
    assert push_module.main() == 1
    captured = capsys.readouterr()
    assert "failed: https://a" in captured.err
    assert "pushed 0, skipped 0, failed 1 of 1" in captured.out
