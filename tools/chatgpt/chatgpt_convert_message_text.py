"""Message text: extracted from convert.py."""

from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from tools.chatgpt.part_text import part_text
else:
    from part_text import part_text

JsonDict = dict[str, Any]


def chatgpt_convert_message_text(message: JsonDict) -> str:
    """The text of one message, with code and execution output kept fenced."""
    content = message.get("content") or {}
    if content.get("content_type") in ("code", "execution_output"):
        return f"```\n{content.get('text', '')}\n```"
    parts = content.get("parts")
    if isinstance(parts, list):
        return "\n\n".join(text for text in (part_text(part) for part in parts) if text.strip())
    text = content.get("text")
    return text if isinstance(text, str) else ""
