"""Recover url: extracted from normalize_thin_clip.py."""

import re
from pathlib import Path
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tools.capture.thin_clip_error import ThinClipError
else:
    from thin_clip_error import ThinClipError


def recover_url(value: str, clip_dir: Path) -> str:
    """The one `https://` URL inside a field a Shortcut corrupted.

    Refuses rather than guesses on none or several. The population is two clips
    and each is the cited source of a live wiki page: a wrong URL here fetches a
    page that is not the source, and nothing downstream would catch it.
    """
    found: list[str] = re.findall(r"https://\S+", value)
    if not found:
        raise ThinClipError(f"{clip_dir}: url field holds no https:// URL")
    if len(found) > 1:
        raise ThinClipError(
            f"{clip_dir}: url field holds {len(found)} https:// URLs, refusing to pick"
        )
    return found[0]
