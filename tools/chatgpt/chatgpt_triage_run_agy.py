"""Run agy: extracted from triage.py."""

import subprocess
import sys
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from tools.chatgpt.chatgpt_triage_unwrap_agy_response import (
        chatgpt_triage_unwrap_agy_response as unwrap_agy_response,
    )
else:
    from chatgpt_triage_unwrap_agy_response import (
        chatgpt_triage_unwrap_agy_response as unwrap_agy_response,
    )

JsonDict = dict[str, Any]

AGY_BULK_MODEL = "gemini-3.1-pro-high"


def chatgpt_triage_run_agy(prompt: str, schema_path: str) -> JsonDict | None:
    """One agy call on the bulk model, None on timeout, failure or junk output."""
    try:
        result = subprocess.run(
            [
                "agy",
                "-p",
                prompt,
                "--model",
                AGY_BULK_MODEL,
                "--json-schema",
                schema_path,
                "--output-format",
                "json",
                "--print-timeout",
                "20m",
                "--sandbox",
                "--mode",
                "plan",
            ],
            capture_output=True,
            text=True,
            timeout=25 * 60,
            check=False,
        )
    except subprocess.TimeoutExpired:
        return None
    if result.returncode != 0:
        print(f"agy exited {result.returncode}: {result.stderr[-300:]}", file=sys.stderr)
        return None
    return unwrap_agy_response(result.stdout)
