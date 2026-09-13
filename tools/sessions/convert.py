#!/usr/bin/env python3
"""Render local agent-CLI session logs as one markdown file per session.

Same pattern as tools/chatgpt/convert.py: the raw store stays where the tool
wrote it (mirrored under sources/agent-sessions/, gitignored), and what enters
git is the conversation a reader wants - user and assistant text only, no tool
calls, no tool output, no injected instruction payloads. Measured on a 30-file
sample that text is ~9% of the raw bytes, which is what makes the corpus fit
in the repository at all.

Stores handled:
  claude-code  ~/.claude/projects/<project>/<uuid>.jsonl
  codex        ~/.codex/sessions/YYYY/MM/DD/rollout-*.jsonl

  antigravity  ~/.gemini/antigravity-cli/conversations/<uuid>.db
  claude-desktop  ~/Library/Application Support/Claude*/local-agent-mode-sessions/
                  (Cowork local mode; same jsonl format, nested per session)

Antigravity stores protobuf blobs (steps.step_payload) with no schema on
disk; a generic wire-format walk is enough because the text lives at stable
paths, mapped by sampling 60 conversations: step_type 14 is the user turn
(field 19.2), step_type 15 the model turn (20.1 is the visible reply, 20.3
is thinking - skipped), step_type 2 the structured final result (12.2).
Everything else is tool traffic, quota errors, or system metadata.

Output: <SYNTOPICA_DATA>/<brain.sources>/sessions/<store>/<date>-<slug>-<id8>.md,
overwritten in place. brain.sources is read from syntopica.config.json,
so re-running after new sessions is safe and cheap. Sessions with no real user
text after filtering (warmups, pure command runs) are skipped.

Usage:  python3 tools/sessions/convert.py [claude-code|claude-desktop|codex|antigravity] ...
        (no args = all four stores; --help validates configuration without converting)
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

import json
import re
import sqlite3
from collections.abc import Iterator
from datetime import UTC, datetime
from functools import partial
from typing import TYPE_CHECKING, Any

__all__ = [
    "UTC",
    "Any",
    "Iterator",
    "Path",
    "convert_antigravity",
    "convert_claude_hosts",
    "convert_claude_jsonl",
    "convert_codex",
    "datetime",
    "is_noise",
    "iter_jsonl",
    "json",
    "main",
    "message_text",
    "platform",
    "proto_strings",
    "re",
    "slugify",
    "sqlite3",
    "sys",
    "write_page",
]

import platform

if TYPE_CHECKING:
    from tools.sessions.configured_desktop_roots import configured_desktop_roots
    from tools.sessions.convert_antigravity import convert_antigravity as _convert_antigravity
    from tools.sessions.convert_claude_hosts import convert_claude_hosts as _convert_claude_hosts
    from tools.sessions.convert_claude_jsonl import convert_claude_jsonl as _convert_claude_jsonl
    from tools.sessions.convert_codex import convert_codex as _convert_codex
    from tools.sessions.is_noise import is_noise
    from tools.sessions.iter_jsonl import iter_jsonl
    from tools.sessions.proto_strings import proto_strings
    from tools.sessions.sessions_convert_message_text import (
        sessions_convert_message_text as message_text,
    )
    from tools.sessions.sessions_hosts_mirror import sessions_hosts_mirror
    from tools.sessions.sessions_output_directory import sessions_output_directory
    from tools.sessions.slugify import slugify
    from tools.sessions.write_page import write_page as _write_page
else:
    from configured_desktop_roots import configured_desktop_roots
    from convert_antigravity import convert_antigravity as _convert_antigravity
    from convert_claude_hosts import convert_claude_hosts as _convert_claude_hosts
    from convert_claude_jsonl import convert_claude_jsonl as _convert_claude_jsonl
    from convert_codex import convert_codex as _convert_codex
    from is_noise import is_noise
    from iter_jsonl import iter_jsonl
    from proto_strings import proto_strings
    from sessions_convert_message_text import sessions_convert_message_text as message_text
    from sessions_hosts_mirror import sessions_hosts_mirror
    from sessions_output_directory import sessions_output_directory
    from slugify import slugify
    from write_page import write_page as _write_page

CLAUDE_ROOT = Path.home() / ".claude" / "projects"
CODEX_ROOT = Path.home() / ".codex" / "sessions"
ANTIGRAVITY_ROOT = Path.home() / ".gemini" / "antigravity-cli" / "conversations"
# Claude desktop local-agent (Cowork local mode) sessions carry a nested
# .claude/projects tree per session, in the same jsonl format as the CLI;
# they do NOT appear in ~/.claude/projects. VM-mode sessions do (as -root-*
# project dirs), so they are already covered by the claude-code store. The
# roots themselves name the owner's desktop profiles, so they come from the
# instance configuration; None means "ask it", a list overrides it.
DESKTOP_ROOTS: list[Path] | None = None
# Cowork local mode is per machine, so the other Mac's store is mirrored here
# (rsync -a --delete, gitignored) under hosts/<host>/local-agent-mode-sessions
# and converted with host: set to that directory name. Local roots carry this
# machine's short hostname.
LOCAL_HOST = platform.node().split(".")[0].lower().replace(" ", "-") or "local"

# User-role payloads that are injected by the harness, not typed by the user.
NOISE_PREFIXES = (
    "<system-reminder",
    "<local-command",
    "<command-name",
    "<command-message",
    "<task-notification",
    "[SYSTEM NOTIFICATION",
    "[Request interrupted",
    "# AGENTS.md instructions",
    "<user_instructions>",
    "<environment_context>",
    "<ENVIRONMENT",
    "<turn_context",
    "## Memory",
    "Caveat: The messages below",
)


convert_claude_jsonl = partial(
    _convert_claude_jsonl, get_write_page=partial(globals().__getitem__, "write_page")
)

convert_codex = partial(
    _convert_codex,
    get_codex_root=partial(globals().__getitem__, "CODEX_ROOT"),
    get_write_page=partial(globals().__getitem__, "write_page"),
)

write_page = partial(_write_page, get_out=sessions_output_directory)

WIRE_VARINT = 0
WIRE_64BIT = 1
WIRE_LENGTH_DELIMITED = 2
WIRE_32BIT = 5
# Sub-message recursion stops here: the mapped text paths are at most three
# levels deep, and a mis-parsed blob otherwise recurses over its own noise.
MAX_PROTO_DEPTH = 4


# step_type -> (role, field path of the text worth keeping)
ANTIGRAVITY_FIELDS = {14: ("user", "19.2"), 15: ("assistant", "20.1"), 2: ("assistant", "12.2")}


convert_antigravity = partial(
    _convert_antigravity,
    get_antigravity_root=partial(globals().__getitem__, "ANTIGRAVITY_ROOT"),
    get_write_page=partial(globals().__getitem__, "write_page"),
)

convert_claude_hosts = partial(
    _convert_claude_hosts,
    get_claude_root=partial(globals().__getitem__, "CLAUDE_ROOT"),
    get_desktop_roots=partial(
        configured_desktop_roots, get_override=partial(globals().__getitem__, "DESKTOP_ROOTS")
    ),
    get_hosts_mirror=sessions_hosts_mirror,
    get_local_host=partial(globals().__getitem__, "LOCAL_HOST"),
    get_convert_claude_jsonl=partial(globals().__getitem__, "convert_claude_jsonl"),
)


def main() -> int:
    """Convert the stores named on the command line, or all four by default."""
    try:
        sessions_output_directory()
    except ValueError as error:
        print(f"convert: {error}", file=sys.stderr)
        return 78
    if sys.argv[1:] == ["--help"]:
        print("Usage: convert.py [claude-code|claude-desktop|codex|antigravity] ...")
        return 0
    stores = sys.argv[1:] or ["claude-code", "claude-desktop", "codex", "antigravity"]
    for store in stores:
        if store in ("claude-code", "claude-desktop"):
            kept, skipped = convert_claude_hosts(store)
        elif store == "codex":
            kept, skipped = convert_codex()
        elif store == "antigravity":
            kept, skipped = convert_antigravity()
        else:
            sys.exit(f"unknown store: {store}")
        print(f"{store}: {kept} written, {skipped} skipped (empty or no user text)")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
