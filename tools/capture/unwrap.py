"""Unwrap: extracted from screen_pending.py."""

import json
from typing import Any, cast


def unwrap(stdout: str) -> dict[str, Any] | None:
    """The verdict object inside agy's envelope, or inside a bare answer.

    agy wraps a print-mode answer in its own JSON with the model's text under
    `response`; a schema run sometimes returns that text already parsed. Both
    shapes appear in practice, so both are accepted here rather than assumed.
    """
    try:
        envelope = json.loads(stdout)
    except json.JSONDecodeError:
        return None
    if isinstance(envelope, dict) and "verdicts" in envelope:
        return envelope
    body = envelope.get("response") if isinstance(envelope, dict) else None
    if isinstance(body, dict):
        return body
    if isinstance(body, str):
        try:
            return cast(dict[str, Any], json.loads(body))
        except json.JSONDecodeError:
            return None
    return None
