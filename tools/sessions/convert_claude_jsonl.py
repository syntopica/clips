"""Convert claude jsonl: extracted from convert.py."""

from collections.abc import Callable
from pathlib import Path
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tools.sessions.is_noise import is_noise
    from tools.sessions.iter_jsonl import iter_jsonl
    from tools.sessions.sessions_convert_message_text import (
        sessions_convert_message_text as message_text,
    )
else:
    from is_noise import is_noise
    from iter_jsonl import iter_jsonl
    from sessions_convert_message_text import sessions_convert_message_text as message_text


def convert_claude_jsonl(
    paths: list[Path],
    store: str,
    host: str | None = None,
    *,
    get_write_page: Callable[[], Callable[..., bool]],
) -> tuple[int, int]:
    """Render each claude-code/claude-desktop jsonl transcript; (written, skipped)."""
    write_page = get_write_page()
    kept = skipped = 0
    for path in paths:
        turns: list[tuple[str, str]] = []
        meta: dict[str, str] = {"host": host} if host else {}
        summary = ""
        for obj in iter_jsonl(path):
            if obj.get("type") == "summary":
                summary = summary or obj.get("summary", "")
                continue
            if obj.get("isSidechain") or obj.get("isMeta"):
                continue
            message = obj.get("message") or {}
            role = message.get("role")
            if obj.get("type") not in ("user", "assistant") or role not in ("user", "assistant"):
                continue
            ts = obj.get("timestamp", "")
            if ts:
                meta.setdefault("created", ts)
                meta["updated"] = ts
            if obj.get("cwd"):
                meta.setdefault("cwd", obj["cwd"])
            text = message_text(message.get("content"))
            if not text.strip() or (role == "user" and is_noise(text)):
                continue
            turns.append((role, text))
        if not meta.get("created"):
            skipped += 1
            continue
        first_user = next((t for r, t in turns if r == "user"), "")
        title = summary or first_user.split("\n", 1)[0][:120] or "session"
        if write_page(store, path.stem, title, meta, turns):
            kept += 1
        else:
            skipped += 1
    return kept, skipped
