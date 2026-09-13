"""Linear messages: extracted from convert.py."""

from typing import Any

JsonDict = dict[str, Any]


def linear_messages(tree: JsonDict) -> list[JsonDict]:
    """The conversation as displayed: the current leaf walked up to the root.

    A ChatGPT conversation is a tree - every regenerate and every edit forks it -
    and the UI shows one path through it. That path is what a reader wants; the
    branches stay in the raw JSON written alongside.
    """
    mapping = tree.get("mapping") or {}
    node_id = tree.get("current_node")
    chain: list[JsonDict] = []
    seen: set[str] = set()
    while node_id and node_id in mapping and node_id not in seen:
        seen.add(node_id)
        node = mapping[node_id]
        message = node.get("message")
        if message is not None:
            chain.append(message)
        node_id = node.get("parent")
    chain.reverse()
    return chain
