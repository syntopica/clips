"""Choose the capture archive through the engine that owns the rule."""

from pathlib import Path
from typing import TYPE_CHECKING

from tools.bootstrap.brain_engine_on_path import brain_engine_on_path

if TYPE_CHECKING:
    from tools.index.syntopica_config import SyntopicaConfig


def engine_archive(config: "SyntopicaConfig") -> Path:
    """Apply the engine's archive selection, imported at call time."""
    brain_engine_on_path()
    from tools.index.configured_archive import configured_archive

    # Wrapped rather than returned bare: in the clips repository the engine is
    # a sibling checkout mypy cannot see, so the call is untyped there.
    return Path(configured_archive(config))
