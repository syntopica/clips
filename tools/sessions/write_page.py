"""Write page: extracted from convert.py."""

from collections.abc import Callable
from pathlib import Path
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tools.sessions.slugify import slugify
else:
    from slugify import slugify


def write_page(
    store: str,
    sid: str,
    title: str,
    meta: dict[str, str],
    turns: list[tuple[str, str]],
    *,
    get_out: Callable[[], Path],
) -> bool:
    """One markdown file for one session; returns False when there is nothing to keep."""
    OUT = get_out()
    if not any(role == "user" for role, _ in turns):
        return False
    date = meta["created"][:10]
    out_dir = OUT / store
    out_dir.mkdir(parents=True, exist_ok=True)
    # Last 8 hex of the id, not the first: Codex ids are UUIDv7, whose prefix
    # is a timestamp with ~65s granularity - first-8 collides across a day.
    path = out_dir / f"{date}-{slugify(title)}-{sid.replace('-', '')[-8:]}.md"
    lines = ["---"]
    lines.append(f'title: "{title[:120].replace(chr(34), chr(39))}"')
    lines.append(f"session_id: {sid}")
    lines.append(f"store: {store}")
    for key in ("host", "cwd", "created", "updated"):
        if meta.get(key):
            lines.append(f"{key}: {meta[key]}")
    lines.append(f"messages: {len(turns)}")
    lines.append("---")
    lines.append("")
    lines.append(f"# {title[:120]}")
    for role, text in turns:
        lines.append("")
        lines.append("## User" if role == "user" else "## Assistant")
        lines.append("")
        lines.append(text.strip())
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return True
