"""Convert claude hosts: extracted from convert.py."""

from collections.abc import Callable
from pathlib import Path


def convert_claude_hosts(
    store: str,
    *,
    get_claude_root: Callable[[], Path],
    get_desktop_roots: Callable[[], list[Path]],
    get_hosts_mirror: Callable[[], Path],
    get_local_host: Callable[[], str],
    get_convert_claude_jsonl: Callable[[], Callable[..., tuple[int, int]]],
) -> tuple[int, int]:
    """Render one store across this machine and every mirrored host.

    Walks this machine's store first, then every mirrored host under
    sources/agent-sessions/hosts/<host>/. A session id already written by an
    earlier host is skipped: Cowork local-mode logs are synced per account, so
    both Macs hold byte-identical copies and the tag would otherwise be
    whichever host ran last.
    """
    CLAUDE_ROOT = get_claude_root()
    DESKTOP_ROOTS = get_desktop_roots()
    HOSTS_MIRROR = get_hosts_mirror()
    LOCAL_HOST = get_local_host()
    convert_claude_jsonl = get_convert_claude_jsonl()
    mirror_dir = "claude-projects" if store == "claude-code" else "local-agent-mode-sessions"
    local_roots = [CLAUDE_ROOT] if store == "claude-code" else DESKTOP_ROOTS
    hosts = [(LOCAL_HOST, local_roots)] + [
        (d.name, [d / mirror_dir]) for d in sorted(HOSTS_MIRROR.glob("*")) if d.is_dir()
    ]
    kept = skipped = 0
    seen: set[str] = set()
    for host, roots in hosts:
        if store == "claude-code":
            paths = sorted(p for root in roots for p in root.glob("*/*.jsonl"))
        else:
            paths = sorted(
                p
                for root in roots
                for p in root.rglob("*.jsonl")
                if p.parent.parent.name == "projects" and "subagents" not in p.parts
            )
        fresh = [p for p in paths if p.stem not in seen]
        seen.update(p.stem for p in fresh)
        k, sk = convert_claude_jsonl(fresh, store, host=host)
        print(
            f"  {host}: {len(paths)} sessions, {len(paths) - len(fresh)} already seen, {k} written, {sk} skipped"
        )
        kept += k
        skipped += sk
    return kept, skipped
