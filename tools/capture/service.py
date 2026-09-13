"""Service: extracted from push_index_to_service.py."""

from dataclasses import dataclass


@dataclass(frozen=True)
class Service:
    """Where the capture service lives and the bearer token that reaches it."""

    origin: str
    token: str
