"""Resolve the sources directory from the instance selected for this call."""

import json
import os
from pathlib import Path


def sessions_sources_directory() -> Path:
    """Apply keeper.sh's configuration contract without an engine-relative default."""
    data = os.environ.get("SYNTOPICA_DATA", "")
    config = Path(data) / "syntopica.config.json"
    if not data or not Path(data).is_dir() or not config.is_file():
        raise ValueError("SYNTOPICA_DATA must name a directory containing syntopica.config.json")
    try:
        sources = json.loads(config.read_text(encoding="utf-8"))["brain"]["sources"]
        if not isinstance(sources, str) or not sources.strip():
            raise ValueError("brain.sources must be a non-empty string")
    except (OSError, ValueError, KeyError, TypeError) as error:
        raise ValueError(
            "SYNTOPICA_DATA/syntopica.config.json must define brain.sources "
            "as a non-empty string in valid JSON"
        ) from error
    return Path(f"{data}/{sources}")
