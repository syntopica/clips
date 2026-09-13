"""Load a `tools/capture` script as an importable module, and build clip fixtures.

The capture tools are scripts, not a package: each one puts its own directory on
`sys.path` and imports `url_index` by bare name. Loading them by file path and
registering the result under that bare name is what makes a test see the same
`url_index` the tool under test sees, so patching one patches both.
"""

import importlib.util
import json
import sys
from pathlib import Path
from types import ModuleType

from tests.tool_paths import TOOLS_ROOT

CAPTURE_ROOT = TOOLS_ROOT / "capture"


def load_capture_module(name: str) -> ModuleType:
    """Import `tools/capture/<name>.py` once per session, under its bare name."""
    path = CAPTURE_ROOT / f"{name}.py"
    cached = sys.modules.get(name)
    if cached is not None and getattr(cached, "__file__", None) == str(path):
        return cached
    spec = importlib.util.spec_from_file_location(name, path)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    sys.path.insert(0, str(CAPTURE_ROOT))
    try:
        spec.loader.exec_module(module)
    finally:
        sys.path.pop(0)
    return module


def write_clip(
    repo: Path,
    clip_dir: str,
    metadata: dict[str, object] | None = None,
    files: dict[str, str] | None = None,
) -> Path:
    """Create one clip directory: a `state.json`, optional metadata, and any extra files."""
    path = repo / clip_dir
    path.mkdir(parents=True, exist_ok=True)
    (path / "state.json").write_text("{}")
    if metadata is not None:
        (path / "metadata.json").write_text(json.dumps(metadata))
    for name, body in (files or {}).items():
        (path / name).write_text(body)
    return path
