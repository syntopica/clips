"""Construct the response schema for a ChatGPT triage batch."""

from typing import Any


def triage_output_schema() -> dict[str, Any]:
    """Return the existing batch schema without changing its ordering or limits."""
    return {
        "type": "object",
        "properties": {
            "items": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "file": {"type": "string"},
                        "topics": {
                            "type": "array",
                            "items": {"type": "string"},
                            "minItems": 1,
                            "maxItems": 3,
                        },
                        "project": {"type": "string"},
                        "value": {
                            "type": "string",
                            "enum": ["high", "medium", "low", "discard"],
                        },
                        "summary": {"type": "string"},
                    },
                    "required": ["file", "topics", "project", "value", "summary"],
                },
            }
        },
        "required": ["items"],
    }
