"""Message text: extracted from convert.py."""


def sessions_convert_message_text(content: object) -> str:
    """Join the readable text of one Claude message's `content` field.

    A string content is the whole message; a list content keeps only its
    `text` blocks, which is what drops tool calls and tool results.
    """
    parts: list[str] = []
    if isinstance(content, str):
        parts.append(content)
    elif isinstance(content, list):
        for block in content:
            if isinstance(block, dict) and block.get("type") == "text":
                parts.append(block.get("text", ""))
    return "\n\n".join(p for p in parts if p.strip())
