"""Asset backfill: which URL a picture is fetched from, and what a failure records.

The design decision this encodes is "save everything, record the failures too" -
so the interesting cases are the srcset choice, the HTML-escaped URL that would
otherwise fetch a different resource, and the dead image that must leave a row
behind rather than a gap.
"""

import hashlib
import json

import pytest

from tests.capture_modules import load_capture_module, write_clip
from tests.load_sql import load_sql


@pytest.fixture(scope="module")
def backfill():
    return load_capture_module("backfill_assets")


@pytest.fixture()
def connection(tmp_path):
    return load_capture_module("url_index").connect(tmp_path)


def test_largest_srcset_candidate_takes_the_widest(backfill) -> None:
    srcset = "https://cdn/a-320.jpg 320w, https://cdn/a-1400.jpg 1400w, https://cdn/a-640.jpg 640w"
    assert backfill.largest_srcset_candidate(srcset) == "https://cdn/a-1400.jpg"


def test_largest_srcset_candidate_keeps_a_lone_candidate_with_no_width(backfill) -> None:
    assert backfill.largest_srcset_candidate("https://cdn/a.jpg") == "https://cdn/a.jpg"


def test_largest_srcset_candidate_treats_an_unparseable_width_as_zero(backfill) -> None:
    srcset = "https://cdn/a.jpg xxw, https://cdn/b.jpg 10w"
    assert backfill.largest_srcset_candidate(srcset) == "https://cdn/b.jpg"


def test_largest_srcset_candidate_is_none_for_an_empty_attribute(backfill) -> None:
    assert backfill.largest_srcset_candidate("  ,  ") is None


def test_asset_urls_prefers_the_srcset_over_the_src(backfill) -> None:
    html = '<img src="https://cdn/small.jpg" srcset="https://cdn/big.jpg 2000w">'
    assert backfill.asset_urls(html) == ["https://cdn/big.jpg"]


def test_asset_urls_unescapes_an_html_escaped_query(backfill) -> None:
    html = '<img src="https://cdn/i.jpg?w=700&amp;q=20">'
    assert backfill.asset_urls(html) == ["https://cdn/i.jpg?w=700&q=20"]


def test_asset_urls_drops_relative_and_data_sources(backfill) -> None:
    html = '<img src="/local.png"><img src="data:image/gif;base64,AA">'
    assert backfill.asset_urls(html) == []


def test_asset_urls_reports_each_url_once(backfill) -> None:
    html = '<img src="https://cdn/i.jpg"><img src="https://cdn/i.jpg">'
    assert backfill.asset_urls(html) == ["https://cdn/i.jpg"]


def test_extension_for_takes_a_plausible_suffix_from_the_url(backfill) -> None:
    assert backfill.extension_for("https://cdn/photo.JPEG?w=700", None) == ".jpeg"


def test_extension_for_falls_back_to_the_content_type_when_the_suffix_is_too_long(backfill) -> None:
    assert (
        backfill.extension_for("https://cdn/v2/resize:fit:1400", "image/png; charset=x") == ".png"
    )


def test_extension_for_is_bin_when_nothing_says_otherwise(backfill) -> None:
    assert backfill.extension_for("https://cdn/asset", None) == ".bin"


def test_backfill_clip_skips_a_clip_with_no_markup(backfill, tmp_path, connection) -> None:
    clip = write_clip(tmp_path, "clips/pending/a")
    assert backfill.backfill_clip(clip, connection, dry_run=False) == {
        "clip": "a",
        "skipped": "no source.html",
    }


def test_a_dry_run_counts_without_fetching(backfill, tmp_path, connection, monkeypatch) -> None:
    def refuse(url):
        raise AssertionError("a dry run must not fetch")

    monkeypatch.setattr(backfill, "fetch", refuse)
    clip = write_clip(
        tmp_path,
        "clips/pending/a",
        files={"source.html": '<img src="https://cdn/1.png"><img src="https://cdn/2.png">'},
    )
    assert backfill.backfill_clip(clip, connection, dry_run=True) == {"clip": "a", "would_fetch": 2}
    assert not (clip / "assets").exists()


def test_a_fetched_asset_is_stored_under_its_hash_and_the_markup_rewritten(
    backfill, tmp_path, connection, monkeypatch
) -> None:
    body = b"\x89PNG payload"
    monkeypatch.setattr(backfill, "fetch", lambda url: (body, "ok", "image/png"))
    clip = write_clip(
        tmp_path, "clips/pending/a", files={"source.html": '<img src="https://cdn/i.png">'}
    )

    result = backfill.backfill_clip(clip, connection, dry_run=False)

    digest = hashlib.sha256(body).hexdigest()
    assert result == {"clip": "a", "ok": 1, "failed": 0}
    assert (clip / "assets" / f"{digest}.png").read_bytes() == body
    assert f"assets/{digest}.png" in (clip / "source.html").read_text()
    manifest = json.loads((clip / "assets.json").read_text())
    assert manifest["source"] == "backfill"
    assert manifest["assets"]["https://cdn/i.png"]["sha256"] == digest


def test_a_dead_image_is_recorded_rather_than_dropped(
    backfill, tmp_path, connection, monkeypatch
) -> None:
    monkeypatch.setattr(backfill, "fetch", lambda url: (None, "http-404", None))
    clip = write_clip(
        tmp_path, "clips/pending/a", files={"source.html": '<img src="https://cdn/gone.png">'}
    )

    result = backfill.backfill_clip(clip, connection, dry_run=False)

    assert result == {"clip": "a", "ok": 0, "failed": 1}
    row = connection.execute(
        load_sql("capture_backfill_assets/select-assets-asset_sha-status-bytes")
    ).fetchone()
    assert row == (None, "http-404", None)
    assert json.loads((clip / "assets.json").read_text())["assets"]["https://cdn/gone.png"] == {
        "status": "http-404"
    }


def test_markup_is_left_alone_when_every_fetch_failed(
    backfill, tmp_path, connection, monkeypatch
) -> None:
    monkeypatch.setattr(backfill, "fetch", lambda url: (None, "error-TimeoutError", None))
    markup = '<img src="https://cdn/gone.png">'
    clip = write_clip(tmp_path, "clips/pending/a", files={"source.html": markup})
    backfill.backfill_clip(clip, connection, dry_run=False)
    assert (clip / "source.html").read_text() == markup


def test_the_escaped_form_of_a_url_is_rewritten_too(
    backfill, tmp_path, connection, monkeypatch
) -> None:
    monkeypatch.setattr(backfill, "fetch", lambda url: (b"bytes", "ok", "image/png"))
    clip = write_clip(
        tmp_path,
        "clips/pending/a",
        files={"source.html": '<img src="https://cdn/i.png?w=1&amp;q=2">'},
    )
    backfill.backfill_clip(clip, connection, dry_run=False)
    assert "cdn" not in (clip / "source.html").read_text()


def test_pending_lists_only_clips_with_no_manifest(backfill, tmp_path) -> None:
    write_clip(tmp_path, "clips/pending/done", files={"assets.json": "{}"})
    write_clip(tmp_path, "clips/pending/todo")
    assert [path.name for path in backfill.pending(tmp_path)] == ["todo"]


def test_main_without_arguments_prints_the_usage(backfill, monkeypatch, capsys) -> None:
    monkeypatch.setattr(backfill.sys, "argv", ["backfill_assets.py"])
    assert backfill.main() == 2
    assert "Usage:" in capsys.readouterr().out


def test_main_honours_limit_and_reports_a_dry_run_total(
    backfill, monkeypatch, tmp_path, capsys
) -> None:
    for name in ("a", "b", "c"):
        write_clip(
            tmp_path,
            f"clips/pending/{name}",
            files={"source.html": '<img src="https://cdn/i.png">'},
        )
    monkeypatch.setattr(backfill, "default_capture_archive", lambda: tmp_path)
    monkeypatch.setattr(
        backfill.sys, "argv", ["backfill_assets.py", "--dry-run", "--all", "--limit", "2"]
    )
    assert backfill.main() == 0
    assert "2 clips, 2 assets would be fetched" in capsys.readouterr().out
