"""State for: extracted from push_index_to_service.py."""

BUCKET_STATES = {
    "clips/pending/": "captured",
    "clips/processed/": "ingested",
    "clips/needs-claude/": "needs-claude",
}


def state_for(clip_dir: str) -> str | None:
    """The state a clip's bucket implies, or None for a path we do not know.

    The bucket is the whole answer: `url_index.py` records every row's directory
    verbatim, and the pipeline expresses "where did this get to" by moving the
    directory. Nothing here reads the ledger, and nothing needs to.
    """
    for prefix, state in BUCKET_STATES.items():
        if clip_dir.startswith(prefix):
            return state
    return None
