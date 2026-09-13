"""Run agy: extracted from screen_pending.py."""

import subprocess
from pathlib import Path
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from tools.capture.unwrap import unwrap
else:
    from unwrap import unwrap

BULK_MODEL = "gemini-3.1-pro-high"

PRINT_TIMEOUT = "20m"

CALL_TIMEOUT_SECONDS = 25 * 60


def capture_screen_pending_run_agy(prompt: str, schema_path: Path) -> dict[str, Any] | None:
    """The bulk model on one batch, read-only. None on any unreadable answer."""
    try:
        completed = subprocess.run(
            [
                "agy",
                "-p",
                prompt,
                "--model",
                BULK_MODEL,
                "--json-schema",
                str(schema_path),
                "--output-format",
                "json",
                "--print-timeout",
                PRINT_TIMEOUT,
                "--sandbox",
                "--mode",
                "plan",
            ],
            capture_output=True,
            text=True,
            timeout=CALL_TIMEOUT_SECONDS,
            check=False,
        )
    except subprocess.TimeoutExpired:
        return None
    if completed.returncode != 0:
        return None
    return unwrap(completed.stdout)
