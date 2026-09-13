"""Recovering articles a publisher deleted: what is asked of the archive, and what is recorded.

A URL the Wayback Machine does not hold is a permanent loss, and knowing that is
the whole point of the pass - so the behaviour worth pinning is that both
answers land in the `unavailable` table. The availability API is stubbed here.
"""

import io
import json

import pytest

from tests.capture_modules import load_capture_module
from tests.load_sql import load_sql


@pytest.fixture(scope="module")
def recover():
    return load_capture_module("recover_gone")


def _triage(tmp_path, body: str):
    triage = tmp_path / "triage" / "2026-07-29"
    triage.mkdir(parents=True)
    (triage / "topic.md").write_text(body)
    return tmp_path / "triage"


def test_gone_urls_reads_only_the_marked_lines(recover, tmp_path, monkeypatch) -> None:
    monkeypatch.setattr(
        recover,
        "TRIAGE_DIR",
        _triage(
            tmp_path,
            "- [gone-410] [Deleted](https://medium.com/@a/gone) - removed\n"
            "- [x] [Kept](https://medium.com/@a/kept) - fine\n",
        ),
    )
    assert recover.gone_urls() == ["https://medium.com/@a/gone"]


def test_gone_urls_reports_each_url_once(recover, tmp_path, monkeypatch) -> None:
    line = "- [gone-410] [Deleted](https://medium.com/@a/gone) - removed\n"
    monkeypatch.setattr(recover, "TRIAGE_DIR", _triage(tmp_path, line * 2))
    assert recover.gone_urls() == ["https://medium.com/@a/gone"]


def test_a_marked_line_with_no_link_is_skipped(recover, tmp_path, monkeypatch) -> None:
    monkeypatch.setattr(recover, "TRIAGE_DIR", _triage(tmp_path, "- [gone-410] no link here\n"))
    assert recover.gone_urls() == []


def _urlopen(payload):
    class Response(io.BytesIO):
        def __enter__(self):
            return self

        def __exit__(self, *args):
            self.close()
            return False

    return lambda request, timeout=None: Response(json.dumps(payload).encode())


def test_wayback_snapshot_returns_the_closest_available_capture(recover, monkeypatch) -> None:
    monkeypatch.setattr(
        recover.urllib.request,
        "urlopen",
        _urlopen(
            {"archived_snapshots": {"closest": {"available": True, "url": "https://web.archive/x"}}}
        ),
    )
    assert recover.wayback_snapshot("https://medium.com/@a/gone") == "https://web.archive/x"


def test_wayback_snapshot_is_none_when_the_archive_holds_nothing(recover, monkeypatch) -> None:
    monkeypatch.setattr(recover.urllib.request, "urlopen", _urlopen({"archived_snapshots": {}}))
    assert recover.wayback_snapshot("https://medium.com/@a/gone") is None


def test_wayback_snapshot_is_none_when_the_snapshot_is_not_available(recover, monkeypatch) -> None:
    monkeypatch.setattr(
        recover.urllib.request,
        "urlopen",
        _urlopen({"archived_snapshots": {"closest": {"available": False, "url": "https://x"}}}),
    )
    assert recover.wayback_snapshot("https://medium.com/@a/gone") is None


def test_wayback_snapshot_swallows_a_transport_failure(recover, monkeypatch) -> None:
    def refuse(request, timeout=None):
        raise TimeoutError("archive.org did not answer")

    monkeypatch.setattr(recover.urllib.request, "urlopen", refuse)
    assert recover.wayback_snapshot("https://medium.com/@a/gone") is None


def test_main_says_so_when_no_markers_exist(recover, tmp_path, monkeypatch, capsys) -> None:
    monkeypatch.setattr(
        recover, "TRIAGE_DIR", _triage(tmp_path, "- [x] [Kept](https://a/b) - fine\n")
    )
    assert recover.main() == 0
    assert capsys.readouterr().out == "no [gone-410] markers found\n"


def test_main_records_both_the_recovered_and_the_unrecoverable(
    recover, tmp_path, monkeypatch, capsys
) -> None:
    monkeypatch.setattr(
        recover,
        "TRIAGE_DIR",
        _triage(
            tmp_path,
            "- [gone-410] [A](https://medium.com/@a/archived) - removed\n"
            "- [gone-410] [B](https://medium.com/@a/lost) - removed\n",
        ),
    )
    monkeypatch.setattr(recover, "default_capture_archive", lambda: tmp_path)
    monkeypatch.setattr(
        recover,
        "wayback_snapshot",
        lambda url: "https://web.archive/x" if url.endswith("archived") else None,
    )

    assert recover.main() == 0

    connection = load_capture_module("url_index").connect(tmp_path)
    rows = dict(
        connection.execute(load_sql("capture_recover_gone/select-unavailable-url-recovered_from"))
    )
    assert rows == {
        "https://medium.com/@a/archived": "https://web.archive/x",
        "https://medium.com/@a/lost": None,
    }
    assert "2 gone urls: 1 in the archive, 1 unrecoverable" in capsys.readouterr().out


def test_every_gone_url_is_stamped_with_the_410_it_returned(recover, tmp_path, monkeypatch) -> None:
    monkeypatch.setattr(
        recover, "TRIAGE_DIR", _triage(tmp_path, "- [gone-410] [A](https://a/x) - removed\n")
    )
    monkeypatch.setattr(recover, "default_capture_archive", lambda: tmp_path)
    monkeypatch.setattr(recover, "wayback_snapshot", lambda url: None)
    recover.main()
    connection = load_capture_module("url_index").connect(tmp_path)
    status, first_seen, last_tried = connection.execute(
        load_sql("capture_recover_gone/select-unavailable-http_status-first_seen-last_tried")
    ).fetchone()
    assert status == 410
    assert first_seen == last_tried
