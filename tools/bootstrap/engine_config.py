"""Read this instance's configuration through whichever engine checkout holds it."""

from typing import TYPE_CHECKING

from tools.bootstrap.brain_engine_on_path import brain_engine_on_path

if TYPE_CHECKING:
    from tools.index.syntopica_config import SyntopicaConfig


def engine_config(explicit: str | None = None) -> "SyntopicaConfig":
    """Resolve the instance at call time, never at import.

    The import is inside the function on purpose: these adapters ship in the
    clips repository, where the reader lives in a sibling checkout the instance
    names. At import time there may be no instance selected yet, and a module
    that cannot be imported without one cannot be linted, tested or read.
    """
    brain_engine_on_path()
    from tools.index.current_syntopica_config import current_syntopica_config

    return current_syntopica_config(explicit)
