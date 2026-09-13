"""Batch prompt: extracted from triage.py."""

Conversation = dict[str, str]


def batch_prompt(batch: list[Conversation], projects: list[str]) -> str:
    """The triage prompt for one batch: the instructions, then each conversation."""
    lines = [
        "You are triaging exported ChatGPT conversations for a personal",
        "knowledge base. For EACH conversation below, return one item with:",
        "- file: the filename, copied exactly, each input file exactly once.",
        "- topics: 1-3 short kebab-case topic tags (e.g. kubernetes,",
        "  invoicing, career, audio-gear). Reuse tags across items when the",
        "  subject is the same; do not invent near-duplicates.",
        "- project: the owning project if the conversation clearly belongs to",
        '  one of the known projects listed below, else "". Only assign a',
        "  project on clear evidence in the text, not on a shared technology.",
        "- value: high | medium | low | discard.",
        "  discard: throwaway one-shot debugging, trivial how-to, or chit-chat",
        "  with nothing durable. low: minor durable interest signal only.",
        "  medium: says something real about ongoing work, interests, or",
        "  recurring problems. high: contains decisions, specs, business or",
        "  personal facts, or project ideas worth mining into the wiki.",
        "- summary: one English sentence saying what the conversation is",
        "  about and what, if anything, is worth keeping.",
        "",
        "Known projects: " + ", ".join(projects),
        "",
        "Conversations:",
    ]
    for conversation in batch:
        lines += [
            "",
            f"=== file: {conversation['file']}",
            f"title: {conversation['title']}",
            f"date: {conversation['date']}  messages: {conversation['messages']}",
            "excerpt:",
            conversation["excerpt"],
        ]
    return "\n".join(lines)
