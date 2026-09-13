"""Verdict: extracted from write_audit.py."""

from typing import TypedDict


class Verdict(TypedDict):
    """One judgement from the pass, in the shape `verdict-schema.json` enforces."""

    id: str
    verdict: str
    score: int
    reason: str
