"""Resolve rendered sessions under this call's configured sources root."""

from pathlib import Path

from tools.sessions.sessions_sources_directory import sessions_sources_directory


def sessions_output_directory() -> Path:
    """Keep rendered pages in the selected instance, never in the engine."""
    return sessions_sources_directory() / "sessions"
