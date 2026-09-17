"""Review pass: audit."""

import json
from pathlib import Path

import pytest

from tests.brain_engine_required import BRAIN_ENGINE_REQUIRED
from tests.fixtures.make_data_directory import make_data_directory
from tests.review_pass_clip import _clip
from tests.review_pass_judged import _judged
from tests.review_pass_load import _load
from tests.review_pass_mapped import _mapped
from tests.tool_paths import TOOLS_ROOT

# The audit adapter reads the instance through the brain engine's configuration
# reader, so without that checkout there is nothing to read the fixture with.
pytestmark = BRAIN_ENGINE_REQUIRED


@pytest.fixture(scope="module")
def write_audit():
    return _load("write_audit", TOOLS_ROOT / "review-pass" / "write_audit.py")


def _verdicts(work: Path, verdicts: list[dict]) -> None:
    (work / "out").mkdir(parents=True, exist_ok=True)
    (work / "out" / "batch-00.json").write_text(json.dumps({"verdicts": verdicts}))


def _verdict(row_id: str, verdict: str = "keep", score: int = 3) -> dict:
    return {"id": row_id, "verdict": verdict, "score": score, "reason": f"because {row_id}"}


CLIP_WITH_ID = '---\nclip_id: "01m098y2mec0"\n---\n\nbody\n'


def test_a_clip_on_disk_contributes_its_own_id(write_audit, tmp_path) -> None:
    _clip(tmp_path, "clips/pending/a", CLIP_WITH_ID)
    assert write_audit.clip_id({"clip_dir": "clips/pending/a"}, tmp_path) == "01m098y2mec0"


def test_a_clip_that_is_not_on_disk_is_unknown_not_an_error(write_audit, tmp_path) -> None:
    assert write_audit.clip_id({"clip_dir": "clips/pending/gone"}, tmp_path) == "unknown"


def test_a_clip_without_a_clip_id_line_is_unknown(write_audit, tmp_path) -> None:
    _clip(tmp_path, "clips/pending/a", "---\ntitle: x\n---\n\nbody\n")
    assert write_audit.clip_id({"clip_dir": "clips/pending/a"}, tmp_path) == "unknown"


def _run(write_audit, tmp_path, monkeypatch, mapped: list[dict], verdicts: list[dict]) -> Path:
    data = tmp_path / "instance/data"
    if not (data / "syntopica.config.json").exists():
        data = make_data_directory(tmp_path / "instance")
    monkeypatch.setenv("SYNTOPICA_DATA", str(data))
    work = tmp_path / "work"
    work.mkdir(exist_ok=True)
    _verdicts(work, verdicts)
    out = tmp_path / "audit.md"
    argv = [
        "write_audit.py",
        str(work),
        str(_mapped(tmp_path, mapped)),
        str(out),
        "2026-07-29",
        "2026-08-02",
    ]
    write_audit.main(argv)
    return out


def test_a_batch_that_dropped_an_entry_refuses_to_write(write_audit, tmp_path, monkeypatch) -> None:
    with pytest.raises(SystemExit) as raised:
        _run(write_audit, tmp_path, monkeypatch, [_judged("a"), _judged("b")], [_verdict("a")])
    assert "missing=['b']" in str(raised.value)
    assert not (tmp_path / "audit.md").exists()


def test_a_verdict_for_an_id_never_sent_refuses_to_write(
    write_audit, tmp_path, monkeypatch
) -> None:
    with pytest.raises(SystemExit) as raised:
        _run(write_audit, tmp_path, monkeypatch, [_judged("a")], [_verdict("a"), _verdict("zz")])
    assert "invented=['zz']" in str(raised.value)


def test_only_captured_uncited_rows_have_to_be_judged(write_audit, tmp_path, monkeypatch) -> None:
    mapped = [
        _judged("a"),
        _judged("b", in_wiki=True),
        _judged("c", bucket="uncaptured", clip_dir=""),
    ]
    out = _run(write_audit, tmp_path, monkeypatch, mapped, [_verdict("a")])
    assert "| Judged this run | 1 |" in out.read_text()


def test_the_shortlist_is_ordered_by_descending_score(write_audit, tmp_path, monkeypatch) -> None:
    mapped = [_judged("a"), _judged("b"), _judged("c")]
    verdicts = [_verdict("a", score=2), _verdict("b", score=5), _verdict("c", "skip", 1)]
    text = _run(write_audit, tmp_path, monkeypatch, mapped, verdicts).read_text()
    assert text.index("### Score 5") < text.index("### Score 2")
    assert "title c" not in text


def test_a_kept_entry_carries_the_clip_id_the_ingest_needs(
    write_audit, tmp_path, monkeypatch
) -> None:
    data = make_data_directory(tmp_path / "instance")
    _clip(data / "clips", "clips/pending/a", CLIP_WITH_ID)
    out = _run(write_audit, tmp_path, monkeypatch, [_judged("a")], [_verdict("a")])
    assert "`01m098y2mec0`" in out.read_text()


def test_the_never_captured_rows_are_listed_for_completeness(
    write_audit, tmp_path, monkeypatch
) -> None:
    mapped = [_judged("a"), _judged("c", bucket="uncaptured", clip_dir="")]
    out = _run(write_audit, tmp_path, monkeypatch, mapped, [_verdict("a")])
    text = out.read_text()
    assert "## The 1 that were never captured" in text
    assert "[title c](https://medium.com/@a/c)" in text


def test_the_never_captured_prose_still_says_thirteen(write_audit, tmp_path, monkeypatch) -> None:
    """Today's behaviour, and a defect: the paragraph is frozen to one harvest.

    The heading and the list are computed, but the sentence under them hardcodes
    the 2026-07-29 shape - "Six share one author and all thirteen" - so any other
    harvest renders a count that contradicts its own heading. Recorded, not fixed.
    """
    mapped = [_judged("a"), _judged("c", bucket="uncaptured", clip_dir="")]
    text = _run(write_audit, tmp_path, monkeypatch, mapped, [_verdict("a")]).read_text()
    assert "## The 1 that were never captured" in text
    assert "all thirteen are micro-SaaS idea listicles" in text


def test_a_run_with_nothing_to_judge_divides_by_zero(write_audit, tmp_path, monkeypatch) -> None:
    """Today's behaviour, and a defect: the keep percentage is unguarded.

    A harvest whose Review entries are all already cited or never captured has
    no verdicts, the id check passes on two empty sets, and the render dies in
    `100 * len(keeps) / len(verdicts)`. Recorded, not fixed.
    """
    with pytest.raises(ZeroDivisionError):
        _run(write_audit, tmp_path, monkeypatch, [_judged("b", in_wiki=True)], [])
