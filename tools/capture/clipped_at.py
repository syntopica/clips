"""Clipped at: extracted from push_index_to_service.py."""

import json
from pathlib import Path


def clipped_at(repo: Path, clip_dir: str) -> str:
    """The clip's own timestamp, or the date its directory name carries.

    A capture with no timestamp is stamped 'now' by the service, which would date
    a July clip in August and make the inbox's ordering a lie.
    """
    path = repo / clip_dir / "metadata.json"
    if path.exists():
        try:
            value = json.loads(path.read_text()).get("clipped_at")
            if value:
                return str(value)
        except json.JSONDecodeError:
            pass
    name = Path(clip_dir).name
    return f"{name[:10]}T00:00:00Z" if name[:4].isdigit() else ""
