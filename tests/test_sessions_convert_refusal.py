"""The script's process status must carry the configuration refusal to its caller."""

import os
import subprocess
import sys

from tests.tool_paths import TOOLS_ROOT


def test_script_refuses_missing_variable_without_writing(tmp_path, monkeypatch):
    monkeypatch.delenv("SYNTOPICA_DATA", raising=False)
    monkeypatch.setenv("HOME", str(tmp_path))
    monkeypatch.setenv("PYTHONDONTWRITEBYTECODE", "1")
    before = sorted(tmp_path.rglob("*"))
    result = subprocess.run(
        [sys.executable, str(TOOLS_ROOT / "sessions/convert.py")],
        cwd=tmp_path,
        env=os.environ.copy(),
        capture_output=True,
        text=True,
        check=False,
    )

    assert result.returncode == 78
    assert result.stdout == ""
    assert result.stderr == (
        "convert: SYNTOPICA_DATA must name a directory containing syntopica.config.json\n"
    )
    assert sorted(tmp_path.rglob("*")) == before
