"""Where this owner's Claude desktop stores live, unless a caller says otherwise."""

from collections.abc import Callable
from pathlib import Path

from tools.bootstrap.engine_config import engine_config


def configured_desktop_roots(*, get_override: Callable[[], list[Path] | None]) -> list[Path]:
    """Take the override when there is one, else the instance's configured roots.

    The roots are one directory per desktop profile, and the profile names are
    the owner's own (`Claude`, a work profile, a third account), so they are
    configuration rather than code: `sessions.desktopRoots`.
    """
    override = get_override()
    if override is not None:
        return list(override)
    return list(engine_config().desktop_roots)
