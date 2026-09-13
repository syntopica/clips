"""Put the configured brain engine on `sys.path` when it is a sibling checkout.

The capture, sessions and review-pass adapters read the instance through the
configuration contract, whose Python implementation belongs to the brain
engine. Inside the monorepo that import already resolves and this is a no-op;
in the split repositories the engine is a sibling checkout the instance names,
so the path has to be read before the reader itself can be imported.

That is why this module parses `syntopica.config.json` by hand rather than
calling `load_syntopica_config`: a bootstrap cannot import the thing it exists
to make importable. It reads two keys and validates nothing, because the real
loader validates everything the moment it is reachable.
"""

import json
import os
from pathlib import Path


def brain_engine_on_path(start: Path | None = None) -> Path | None:
    """Return the engine root added to `sys.path`, or None when none was needed."""
    import sys

    if any((Path(entry) / "tools/index").is_dir() for entry in sys.path if entry):
        return None
    selected = os.environ.get("SYNTOPICA_DATA")
    root = Path(selected) if selected else None
    if root is None:
        here = (start or Path.cwd()).resolve()
        for candidate in (here, *here.parents):
            if (candidate / "syntopica.config.json").is_file():
                root = candidate
                break
    if root is None:
        return None
    document = json.loads((root / "syntopica.config.json").read_text(encoding="utf-8"))
    configured = document.get("engines", {}).get("brain", {}).get("path")
    if configured is None:
        return None
    engine = (root / str(configured)).resolve()
    sys.path.insert(0, str(engine))
    return engine
