"""Triage batch: extracted from triage.py."""

from collections.abc import Callable
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from tools.chatgpt.batch_prompt import batch_prompt
    from tools.chatgpt.chatgpt_triage_validate_items import (
        chatgpt_triage_validate_items as validate_items,
    )
else:
    from batch_prompt import batch_prompt
    from chatgpt_triage_validate_items import chatgpt_triage_validate_items as validate_items

JsonDict = dict[str, Any]

Conversation = dict[str, str]


def triage_batch(
    batch: list[Conversation],
    projects: list[str],
    schema_path: str,
    *,
    get_run_agy: Callable[[], Callable[..., JsonDict | None]],
) -> list[JsonDict] | None:
    """Classify one batch, retrying once before giving up on it."""
    run_agy = get_run_agy()
    prompt = batch_prompt(batch, projects)
    for _ in range(2):
        items = validate_items(run_agy(prompt, schema_path), batch)
        if items is not None:
            return items
    return None
