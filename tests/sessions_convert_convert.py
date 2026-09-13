"""Sessions convert: convert."""

import importlib.util
import sys
from pathlib import Path
from types import ModuleType

import pytest

from tests.tool_paths import TOOLS_ROOT


@pytest.fixture
def convert(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> ModuleType:
    monkeypatch.setenv("HOME", str(tmp_path))
    monkeypatch.delenv("SYNTOPICA_DATA", raising=False)
    path = TOOLS_ROOT / "sessions" / "convert.py"
    spec = importlib.util.spec_from_file_location("sessions_convert", path)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    original = sys.argv[:]
    sys.argv = [str(path)]
    try:
        spec.loader.exec_module(module)
    finally:
        sys.argv[:] = original
    monkeypatch.setattr(module, "DESKTOP_ROOTS", [])
    return module
