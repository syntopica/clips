"""Largest srcset candidate: extracted from backfill_assets.py."""


def largest_srcset_candidate(srcset: str) -> str | None:
    """The highest-width URL in a srcset, or None if it carries no widths."""
    best: tuple[int, str] | None = None
    for part in srcset.split(","):
        pieces = part.strip().split()
        if not pieces:
            continue
        url = pieces[0]
        width = 0
        if len(pieces) > 1 and pieces[1].endswith("w"):
            try:
                width = int(pieces[1][:-1])
            except ValueError:
                width = 0
        if best is None or width > best[0]:
            best = (width, url)
    return best[1] if best else None
