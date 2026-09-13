"""Is shown: extracted from convert.py."""

from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from tools.chatgpt.chatgpt_convert_message_text import (
        chatgpt_convert_message_text as message_text,
    )
else:
    from chatgpt_convert_message_text import chatgpt_convert_message_text as message_text

JsonDict = dict[str, Any]


def is_shown(message: JsonDict) -> bool:
    """Whether a message is one the reader saw.

    System prompts, the hidden user-context block and the tool chatter behind a
    search are all real nodes in the tree and none of them is conversation.
    """
    if (message.get("metadata") or {}).get("is_visually_hidden_from_conversation"):
        return False
    if ((message.get("author") or {}).get("role")) == "system":
        return False
    return bool(message_text(message).strip())
