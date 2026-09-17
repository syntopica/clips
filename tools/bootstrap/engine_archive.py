"""Choose the capture archive through the engine that owns the rule."""

from pathlib import Path
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tools.index.syntopica_config import SyntopicaConfig


def engine_archive(config: "SyntopicaConfig") -> Path:
    """Return the archive the engine already resolved for this instance."""
    # Wrapped rather than read bare at every call site: in the clips repository
    # the engine is a sibling checkout mypy cannot see, so the attribute is
    # untyped there.
    return Path(config.archive)
