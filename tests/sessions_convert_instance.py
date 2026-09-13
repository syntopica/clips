"""A synthetic instance whose sources never point into the engine checkout."""

import json
from pathlib import Path

import pytest


def sessions_convert_instance(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Path:
    """Select an instance after the converter has already been imported."""
    data = tmp_path / "instance"
    data.mkdir()
    (data / "syntopica.config.json").write_text(
        json.dumps({"brain": {"sources": "captured/conversations"}}), encoding="utf-8"
    )
    monkeypatch.setenv("SYNTOPICA_DATA", str(data))
    return data / "captured/conversations/sessions"
