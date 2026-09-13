"""Normalize: extracted from url_index.py."""

from urllib.parse import parse_qs, urlsplit

IDENTITY_QUERY_PARAMS = {
    "youtube.com": ("v",),
    "www.youtube.com": ("v",),
    "m.youtube.com": ("v",),
}


def capture_url_index_normalize(url: str) -> str:
    """Strip the parts that make the same article look like two URLs.

    Medium appends tracking parameters and a `?source=` provenance chain, and the
    same article circulates with and without a trailing slash. The article's
    identity is host plus path - except on the hosts in `IDENTITY_QUERY_PARAMS`,
    where the named parameters are kept in the order listed.

    A kept value is **not** lowercased while everything else is. YouTube video
    ids are case-sensitive - `zmrPY6S1FwY` - so folding their case would
    reintroduce, narrowly, the collision this exists to prevent. The base string
    stays lowercased whole, path included, because that is what the 1485 rows
    already in this index were keyed with.
    """
    without_query = url.split("?", maxsplit=1)[0].split("#", maxsplit=1)[0]
    base = without_query.rstrip("/").lower()
    parsed = urlsplit(url)
    kept_names = IDENTITY_QUERY_PARAMS.get((parsed.hostname or "").lower(), ())
    if not kept_names:
        return base
    query = parse_qs(parsed.query)
    kept = [f"{name}={query[name][0]}" for name in kept_names if query.get(name)]
    return f"{base}?{'&'.join(kept)}" if kept else base
