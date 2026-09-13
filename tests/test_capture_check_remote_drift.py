"""Has the published article changed since we captured it - decided without a request.

Every fetch in this tool is a real request at one publisher, so the selection is
where the behaviour lives: which clips are eligible, which are remembered as
done, and what a failed fetch is allowed to record. The transport is stubbed in
every test here; a test that reached Medium would be a defect, not coverage.
"""

import pytest

from tests.capture_modules import load_capture_module, write_clip
from tests.load_sql import load_sql


@pytest.fixture(scope="module")
def drift():
    return load_capture_module("check_remote_drift")


@pytest.fixture()
def connection(tmp_path):
    return load_capture_module("url_index").connect(tmp_path)


@pytest.mark.parametrize(
    ("url", "expected"),
    [
        ("https://medium.com/@a/x", True),
        ("https://towardsdatascience.medium.com/x", True),
        ("https://www.youtube.com/watch?v=x", False),
        ("not a url", False),
        # A bare host has no third slash, so there is no host segment to read.
        ("https://medium.com", False),
    ],
)
def test_is_medium_decides_whether_an_extractor_exists(drift, url, expected) -> None:
    assert drift.is_medium(url) is expected


def test_a_host_merely_ending_in_medium_com_is_read_as_medium(drift) -> None:
    # Documents today's behaviour, not a preference: the bare-domain suffix has
    # no leading dot, so `notmedium.com` matches. Reported, deliberately not fixed.
    assert drift.is_medium("https://notmedium.com/@a/x") is True


def _clip(tmp_path, name, **metadata):
    base = {
        "clip_id": name,
        "url": f"https://medium.com/@a/{name}",
        "content_sha256": "sha-" + name,
        "clipped_at": "2026-08-01T00:00:00Z",
    }
    base.update(metadata)
    return write_clip(tmp_path, f"clips/pending/{name}", base)


def test_candidates_skips_a_clip_with_no_captured_hash(drift, tmp_path) -> None:
    _clip(tmp_path, "a", content_sha256=None)
    assert drift.candidates(tmp_path, None, 10, set()) == []


def test_candidates_skips_a_clip_the_extractor_cannot_read(drift, tmp_path) -> None:
    _clip(tmp_path, "a", url="https://www.youtube.com/watch?v=x")
    assert drift.candidates(tmp_path, None, 10, set()) == []


def test_candidates_takes_the_newest_captures_first(drift, tmp_path) -> None:
    _clip(tmp_path, "old", clipped_at="2026-07-01T00:00:00Z")
    _clip(tmp_path, "new", clipped_at="2026-08-20T00:00:00Z")
    assert [metadata["clip_id"] for _, metadata in drift.candidates(tmp_path, None, 10, set())] == [
        "new",
        "old",
    ]


def test_candidates_stops_at_the_limit(drift, tmp_path) -> None:
    _clip(tmp_path, "a")
    _clip(tmp_path, "b")
    assert len(drift.candidates(tmp_path, None, 1, set())) == 1


def test_candidates_honours_a_clip_filter_as_a_prefix_match(drift, tmp_path) -> None:
    _clip(tmp_path, "alpha")
    _clip(tmp_path, "beta")
    selected = drift.candidates(tmp_path, "alp", 10, set())
    assert [metadata["clip_id"] for _, metadata in selected] == ["alpha"]


def test_candidates_skips_what_a_previous_run_resolved(drift, tmp_path) -> None:
    _clip(tmp_path, "a")
    assert drift.candidates(tmp_path, None, 10, {"a"}) == []


def test_a_failed_check_is_not_remembered_as_a_result(drift, connection) -> None:
    metadata = {"clip_id": "a", "url": "https://medium.com/@a/x", "content_sha256": "sha"}
    drift.already_checked(connection)
    drift.record(connection, metadata, None, "403 from the extractor")
    assert drift.already_checked(connection) == set()


@pytest.mark.parametrize("outcome", ["unchanged", "drifted"])
def test_a_resolved_check_is_remembered(drift, connection, outcome) -> None:
    metadata = {"clip_id": "a", "url": "https://medium.com/@a/x", "content_sha256": "sha"}
    drift.already_checked(connection)
    drift.record(connection, metadata, "remote", outcome)
    assert drift.already_checked(connection) == {"a"}


def test_check_reports_unchanged_when_the_remote_text_still_hashes_the_same(
    drift, connection, monkeypatch
) -> None:
    drift.already_checked(connection)
    monkeypatch.setattr(drift, "remote_body_sha", lambda url: "sha")
    metadata = {"clip_id": "a", "url": "https://medium.com/@a/x", "content_sha256": "sha"}
    assert drift.check(connection, metadata) == "unchanged"
    row = connection.execute(
        load_sql("capture_check_remote_drift/select-remote-checks-remote_sha-outcome")
    ).fetchone()
    assert row == ("sha", "unchanged")


def test_check_reports_drifted_when_the_hashes_differ(drift, connection, monkeypatch) -> None:
    drift.already_checked(connection)
    monkeypatch.setattr(drift, "remote_body_sha", lambda url: "other")
    metadata = {"clip_id": "a", "url": "https://medium.com/@a/x", "content_sha256": "sha"}
    assert drift.check(connection, metadata) == "drifted"


def test_check_records_the_reason_when_the_fetch_never_succeeded(
    drift, connection, monkeypatch
) -> None:
    drift.already_checked(connection)

    def refuse(url):
        raise RuntimeError("403 Forbidden")

    monkeypatch.setattr(drift, "remote_body_sha", refuse)
    metadata = {"clip_id": "a", "url": "https://medium.com/@a/x", "content_sha256": "sha"}
    assert drift.check(connection, metadata) == "failed"
    row = connection.execute(
        load_sql("capture_check_remote_drift/select-remote-checks-remote_sha-outcome")
    ).fetchone()
    assert row == (None, "403 Forbidden")


def test_remote_body_sha_retries_once_before_giving_up(drift, monkeypatch) -> None:
    attempts = []

    class Result:
        def __init__(self, code):
            self.returncode = code
            self.stdout = '{"article": {"body": "text"}}'
            self.stderr = "403\n"

    def fake_run(*args, **kwargs):
        attempts.append(1)
        return Result(1 if len(attempts) == 1 else 0)

    monkeypatch.setattr(drift.subprocess, "run", fake_run)
    monkeypatch.setattr(drift.time, "sleep", lambda seconds: None)
    assert (
        drift.remote_body_sha("https://medium.com/@a/x")
        == drift.hashlib.sha256(b"text").hexdigest()
    )
    assert len(attempts) == 2


def test_remote_body_sha_raises_the_last_stderr_line_after_two_failures(drift, monkeypatch) -> None:
    class Failed:
        returncode = 1
        stdout = ""
        stderr = "context\n403 Forbidden\n"

    monkeypatch.setattr(drift.subprocess, "run", lambda *a, **k: Failed())
    monkeypatch.setattr(drift.time, "sleep", lambda seconds: None)
    with pytest.raises(RuntimeError, match="403 Forbidden"):
        drift.remote_body_sha("https://medium.com/@a/x")


def test_main_without_refetch_lists_the_clips_and_makes_no_request(
    drift, tmp_path, monkeypatch, capsys
) -> None:
    def refuse(url):
        raise AssertionError("listing must not fetch")

    monkeypatch.setattr(drift, "remote_body_sha", refuse)
    _clip(tmp_path, "a")
    monkeypatch.setattr(drift.sys, "argv", ["check_remote_drift.py", str(tmp_path)])
    assert drift.main() == 0
    printed = capsys.readouterr().out
    assert "1 clips; pass --refetch to check them" in printed


def test_main_says_so_when_nothing_matches(drift, tmp_path, monkeypatch, capsys) -> None:
    monkeypatch.setattr(drift.sys, "argv", ["check_remote_drift.py", str(tmp_path)])
    (tmp_path / "clips").mkdir()
    assert drift.main() == 0
    assert capsys.readouterr().out == "no matching clips\n"


def test_main_with_refetch_counts_each_outcome(drift, tmp_path, monkeypatch, capsys) -> None:
    _clip(tmp_path, "a", content_sha256="sha-a")
    _clip(tmp_path, "b", content_sha256="sha-b")
    monkeypatch.setattr(drift, "remote_body_sha", lambda url: "sha-a")
    monkeypatch.setattr(drift.time, "sleep", lambda seconds: None)
    monkeypatch.setattr(
        drift.sys, "argv", ["check_remote_drift.py", "--refetch", "--limit", "2", str(tmp_path)]
    )
    assert drift.main() == 0
    assert "1 unchanged, 1 drifted, 0 could not be fetched" in capsys.readouterr().out


def test_main_narrows_to_one_clip_with_the_clip_flag(drift, tmp_path, monkeypatch, capsys) -> None:
    _clip(tmp_path, "alpha")
    _clip(tmp_path, "beta")
    monkeypatch.setattr(
        drift.sys, "argv", ["check_remote_drift.py", "--clip", "beta", str(tmp_path)]
    )
    assert drift.main() == 0
    printed = capsys.readouterr().out
    assert "beta" in printed
    assert "alpha" not in printed
