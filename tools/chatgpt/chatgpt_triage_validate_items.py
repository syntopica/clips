"""Validate items: extracted from triage.py."""

from typing import Any

JsonDict = dict[str, Any]

Conversation = dict[str, str]

VALUES = {"high", "medium", "low", "discard"}


def chatgpt_triage_validate_items(
    answer: JsonDict | None, batch: list[Conversation]
) -> list[JsonDict] | None:
    """The answer reordered to match the batch, or None if it does not fit it.

    Every input file exactly once, values in range - else the whole batch is
    rejected so no conversation is silently mislabeled or dropped.
    """
    if answer is None or not isinstance(answer.get("items"), list):
        return None
    expected = {conversation["file"] for conversation in batch}
    items: dict[str, JsonDict] = {}
    for item in answer["items"]:
        if not isinstance(item, dict):
            return None
        name = item.get("file")
        if not isinstance(name, str) or name not in expected or name in items:
            return None
        if item.get("value") not in VALUES:
            return None
        if not isinstance(item.get("topics"), list) or not item["topics"]:
            return None
        if not isinstance(item.get("summary"), str) or not isinstance(item.get("project"), str):
            return None
        items[name] = item
    if set(items) != expected:
        return None
    return [items[conversation["file"]] for conversation in batch]
