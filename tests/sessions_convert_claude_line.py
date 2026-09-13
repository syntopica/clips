"""Sessions convert: claude line."""

import json
from typing import Any


def _claude_line(**fields: Any) -> str:
    return json.dumps(fields)
