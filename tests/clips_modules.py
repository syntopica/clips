"""Load a `tools/clips` transport script as an importable module.

The two transports are standalone scripts under a TypeScript package, not a
Python package: nothing imports them by name, and `tools/clips/src/...` is not
an importable path. Loading them by file path is what lets a test reach
`fetch`, `run` and the redirect handler directly instead of shelling out.
"""

import importlib.util
import sys
from types import ModuleType

from tests.tool_paths import ROOT, TOOLS_ROOT

# In the monorepo the package sits at `tools/clips`; in the published clips
# repository it is the repository itself, so `src` is at the root.
_PACKAGED = TOOLS_ROOT / "clips" / "src"
CLIPS_ROOT = _PACKAGED if _PACKAGED.is_dir() else ROOT / "src"


def load_clips_module(name: str, relative_path: str) -> ModuleType:
    """Import `tools/clips/src/<relative_path>` once per session, under `name`."""
    path = CLIPS_ROOT / relative_path
    cached = sys.modules.get(name)
    if cached is not None and getattr(cached, "__file__", None) == str(path):
        return cached
    spec = importlib.util.spec_from_file_location(name, path)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module
