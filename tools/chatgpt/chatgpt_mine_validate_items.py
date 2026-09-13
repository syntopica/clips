"""Validate items: extracted from mine.py."""

from typing import Any

JsonDict = dict[str, Any]


def chatgpt_mine_validate_items(answer: JsonDict | None, names: list[str]) -> list[JsonDict] | None:
    """The answer reordered to match `names`, or None if it does not cover them.

    A batch is accepted whole or not at all: a partial answer would silently
    drop a conversation from the mining pass.
    """
    if answer is None or not isinstance(answer.get("items"), list):
        return None
    expected = set(names)
    items: dict[str, JsonDict] = {}
    for item in answer["items"]:
        if not isinstance(item, dict):
            return None
        name = item.get("file")
        if not isinstance(name, str) or name not in expected or name in items:
            return None
        if not isinstance(item.get("keep"), bool):
            return None
        if not isinstance(item.get("findings"), list):
            return None
        items[name] = item
    if set(items) != expected:
        return None
    return [items[name] for name in names]
