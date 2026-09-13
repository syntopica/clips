"""The capture archive a command uses when it is given no path of its own."""

from pathlib import Path

from tools.bootstrap.engine_archive import engine_archive
from tools.bootstrap.engine_config import engine_config


def default_capture_archive() -> Path:
    """Read the archive from configuration at call time, never at import."""
    return engine_archive(engine_config())
