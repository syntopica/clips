"""Write batches: extracted from build_batches.py."""

from collections.abc import Callable
from pathlib import Path

from candidate import Candidate


def review_pass_build_batches_write_batches(
    candidates: list[Candidate], batches: Path, *, get_batch: Callable[[], int]
) -> None:
    """Write one text file per batch, replacing whatever was there before."""
    BATCH = get_batch()
    batches.mkdir(parents=True, exist_ok=True)
    for stale in batches.glob("*.txt"):
        stale.unlink()
    for start in range(0, len(candidates), BATCH):
        chunk = candidates[start : start + BATCH]
        batches.joinpath(f"batch-{start // BATCH:02d}.txt").write_text(
            "\n\n".join(
                f"### {row['id']}\nTITLE: {row['title']}\n"
                f"TOPIC: {row['topic']}\nTEXT: {row['body']}"
                for row in chunk
            )
            + "\n"
        )
