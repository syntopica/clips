"""Unwrap agy response: extracted from triage.py."""

import json
from typing import Any

JsonDict = dict[str, Any]


def chatgpt_triage_unwrap_agy_response(stdout: str) -> JsonDict | None:
    """The schema-constrained answer out of agy's envelope, None when unusable.

    `structured_output` is the schema-constrained answer; `response` is prose
    and does not reliably parse (same defect as the clips grader, 2026-08-02).
    """
    try:
        envelope = json.loads(stdout)
    except json.JSONDecodeError:
        return None
    if not isinstance(envelope, dict):
        return None
    structured = envelope.get("structured_output")
    if isinstance(structured, dict):
        return structured
    response = envelope.get("response")
    if isinstance(response, str):
        try:
            parsed = json.loads(response)
            return parsed if isinstance(parsed, dict) else None
        except json.JSONDecodeError:
            return None
    return None
