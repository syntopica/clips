"""Call: extracted from push_index_to_service.py."""

import json
import urllib.error
import urllib.request
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from tools.capture.service import Service
else:
    from service import Service

REQUEST_TIMEOUT_SECONDS = 30


def call(service: Service, path: str, method: str, payload: dict[str, Any]) -> dict[str, Any]:
    """One JSON request to the service, with an empty body decoded as an empty object."""
    request = urllib.request.Request(
        f"{service.origin}{path}",
        method=method,
        data=json.dumps(payload).encode(),
        headers={
            "authorization": f"Bearer {service.token}",
            "content-type": "application/json",
        },
    )
    with urllib.request.urlopen(request, timeout=REQUEST_TIMEOUT_SECONDS) as response:
        decoded: dict[str, Any] = json.loads(response.read() or b"{}")
    return decoded
