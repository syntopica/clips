"""Resolve mirrored session stores under this call's configured sources root."""

from pathlib import Path

from tools.sessions.sessions_sources_directory import sessions_sources_directory


def sessions_hosts_mirror() -> Path:
    """Read mirrored hosts from the same instance that receives rendered pages."""
    return sessions_sources_directory() / "agent-sessions" / "hosts"
