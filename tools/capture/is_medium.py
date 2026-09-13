"""Is medium: extracted from check_remote_drift.py."""

MEDIUM_HOSTS = ("medium.com", ".medium.com")

HOST_SEGMENT = 2


def is_medium(url: str) -> bool:
    """Whether this URL is one the Medium extractor can read.

    Promotion and refetch both read Medium's Apollo state, so a non-Medium URL
    has no extractor here and is skipped rather than fetched and misparsed.
    """
    host = url.split("/")[HOST_SEGMENT].lower() if url.count("/") > HOST_SEGMENT else ""
    return host.endswith(MEDIUM_HOSTS)
