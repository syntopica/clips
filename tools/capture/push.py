"""Push: extracted from push_index_to_service.py."""

from collections.abc import Callable
from pathlib import Path
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from tools.capture.clipped_at import clipped_at
    from tools.capture.service import Service
else:
    from clipped_at import clipped_at
    from service import Service


def push(
    service: Service,
    repo: Path,
    url: str,
    clip_dir: str,
    state: str,
    *,
    get_call: Callable[[], Callable[..., dict[str, Any]]],
) -> None:
    """Record one capture and then patch it to its bucket's state and clip directory.

    Two calls rather than one because `POST /api/capture` is the idempotent
    upsert on the normalised URL and only the `PATCH` can set a state; the PATCH
    also marks the capture drained, without which `clips drain` would re-promote
    the whole history.
    """
    call = get_call()
    recorded = call(
        service,
        "/api/capture",
        "POST",
        {
            "url": url,
            "capture_source": "mac-backfill",
            "captured_at": clipped_at(repo, clip_dir),
        },
    )
    capture_id = recorded.get("data", {}).get("capture_id")
    if not capture_id:
        raise ValueError("the service recorded the URL but returned no capture id")
    call(
        service,
        f"/api/captures/{capture_id}",
        "PATCH",
        {"state": state, "clip_dir": clip_dir},
    )
