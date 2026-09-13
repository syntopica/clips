"""Render: extracted from convert.py."""

import json
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from tools.chatgpt.chatgpt_convert_message_text import (
        chatgpt_convert_message_text as message_text,
    )
    from tools.chatgpt.is_shown import is_shown
    from tools.chatgpt.linear_messages import linear_messages
    from tools.chatgpt.stamp import stamp
else:
    from chatgpt_convert_message_text import chatgpt_convert_message_text as message_text
    from is_shown import is_shown
    from linear_messages import linear_messages
    from stamp import stamp

JsonDict = dict[str, Any]


def chatgpt_convert_render(summary: JsonDict, tree: JsonDict) -> str:
    """One conversation as a markdown page: frontmatter, title, then the turns."""
    messages = [m for m in linear_messages(tree) if is_shown(m)]
    title = tree.get("title") or summary.get("title") or "Untitled"
    identifier = summary.get("id") or tree.get("conversation_id") or ""
    lines = [
        "---",
        f"title: {json.dumps(title, ensure_ascii=False)}",
        f"conversation_id: {identifier}",
        f"created: {stamp(tree.get('create_time') or summary.get('create_time'))}",
        f"updated: {stamp(tree.get('update_time') or summary.get('update_time'))}",
        f"archived: {'true' if summary.get('archived') else 'false'}",
        f"messages: {len(messages)}",
        f"url: https://chatgpt.com/c/{identifier}",
        "---",
        "",
        f"# {title}",
        "",
    ]
    for message in messages:
        role = ((message.get("author") or {}).get("role")) or "unknown"
        heading = {"user": "User", "assistant": "ChatGPT", "tool": "Tool"}.get(
            role, role.capitalize()
        )
        model = (message.get("metadata") or {}).get("model_slug")
        suffix = f" ({model})" if model and role == "assistant" else ""
        lines += [f"## {heading}{suffix}", "", message_text(message).strip(), ""]
    return "\n".join(lines).rstrip() + "\n"
