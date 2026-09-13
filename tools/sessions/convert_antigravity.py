"""Convert antigravity: extracted from convert.py."""

import sqlite3
from collections.abc import Callable
from datetime import UTC, datetime
from functools import partial
from pathlib import Path
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tools.sessions.load_sql import load_sql as read_sql
    from tools.sessions.proto_strings import proto_strings
else:
    from load_sql import load_sql as read_sql
    from proto_strings import proto_strings

load_sql = partial(read_sql, directory=Path(__file__).parent)

ANTIGRAVITY_FIELDS = {14: ("user", "19.2"), 15: ("assistant", "20.1"), 2: ("assistant", "12.2")}


def convert_antigravity(
    *, get_antigravity_root: Callable[[], Path], get_write_page: Callable[[], Callable[..., bool]]
) -> tuple[int, int]:
    """Render every antigravity conversation database; (written, skipped)."""
    ANTIGRAVITY_ROOT = get_antigravity_root()
    write_page = get_write_page()
    kept = skipped = 0
    for path in sorted(ANTIGRAVITY_ROOT.glob("*.db")):
        turns: list[tuple[str, str]] = []
        try:
            con = sqlite3.connect(path)
            rows = con.execute(load_sql("convert-antigravity-1")).fetchall()
            con.close()
        except sqlite3.Error:
            skipped += 1
            continue
        for step_type, payload in rows:
            spec = ANTIGRAVITY_FIELDS.get(step_type)
            if not spec or not payload:
                continue
            role, wanted = spec
            for field_path, text in proto_strings(payload):
                if field_path == wanted and text.strip():
                    turns.append((role, text))
                    break
        mtime = datetime.fromtimestamp(path.stat().st_mtime, tz=UTC)
        meta = {"created": mtime.isoformat()}
        first_user = next((t for r, t in turns if r == "user"), "")
        title = first_user.split("\n", 1)[0][:120] or "session"
        if write_page("antigravity", path.stem, title, meta, turns):
            kept += 1
        else:
            skipped += 1
    return kept, skipped
