"""Decode text only at the two-level field paths mapped for Antigravity steps."""

from typing import TYPE_CHECKING

if TYPE_CHECKING or __package__:
    from tools.sessions.protobuf_field_payloads import protobuf_field_payloads
else:
    from protobuf_field_payloads import protobuf_field_payloads


def antigravity_step_text(payload: bytes, field_path: str) -> str | None:
    """Decode a mapped text leaf without interpreting sibling reasoning or tools."""
    if field_path not in ("19.2", "20.1", "12.2"):
        return None
    outer, inner = field_path.split(".")
    messages = protobuf_field_payloads(payload, int(outer))
    if messages is None:
        return None
    for message in messages:
        leaves = protobuf_field_payloads(message, int(inner))
        if leaves is None:
            continue
        for leaf in leaves:
            try:
                text = leaf.decode("utf-8")
            except UnicodeDecodeError:
                continue
            if text.strip():
                return text
    return None
