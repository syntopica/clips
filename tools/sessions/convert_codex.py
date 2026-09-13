"""Convert codex: extracted from convert.py."""

from collections.abc import Callable
from pathlib import Path
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tools.sessions.is_noise import is_noise
    from tools.sessions.iter_jsonl import iter_jsonl
else:
    from is_noise import is_noise
    from iter_jsonl import iter_jsonl


def convert_codex(
    *, get_codex_root: Callable[[], Path], get_write_page: Callable[[], Callable[..., bool]]
) -> tuple[int, int]:
    """Render every codex rollout under CODEX_ROOT; (written, skipped)."""
    CODEX_ROOT = get_codex_root()
    write_page = get_write_page()
    kept = skipped = 0
    for path in sorted(CODEX_ROOT.rglob("rollout-*.jsonl")):
        turns: list[tuple[str, str]] = []
        meta: dict[str, str] = {}
        sid = path.stem
        for obj in iter_jsonl(path):
            ts = obj.get("timestamp", "")
            if obj.get("type") == "session_meta":
                payload = obj.get("payload") or {}
                sid = payload.get("id") or sid
                meta["created"] = payload.get("timestamp") or ts
                meta["cwd"] = payload.get("cwd", "")
                continue
            if obj.get("type") != "response_item":
                continue
            payload = obj.get("payload") or {}
            if payload.get("type") != "message":
                continue
            role = payload.get("role")
            if role not in ("user", "assistant"):
                continue
            if ts:
                meta.setdefault("created", ts)
                meta["updated"] = ts
            parts = [
                block.get("text", "")
                for block in payload.get("content") or []
                if isinstance(block, dict) and block.get("type") in ("input_text", "output_text")
            ]
            text = "\n\n".join(p for p in parts if p.strip())
            if not text.strip() or (role == "user" and is_noise(text)):
                continue
            turns.append((role, text))
        if not meta.get("created"):
            skipped += 1
            continue
        first_user = next((t for r, t in turns if r == "user"), "")
        title = first_user.split("\n", 1)[0][:120] or "session"
        if write_page("codex", sid, title, meta, turns):
            kept += 1
        else:
            skipped += 1
    return kept, skipped
