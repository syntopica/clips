"""Is noise: extracted from convert.py."""

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


def is_noise(text: str) -> bool:
    """True when a user-role payload was injected by the harness, not typed."""
    return text.lstrip().startswith(NOISE_PREFIXES)
