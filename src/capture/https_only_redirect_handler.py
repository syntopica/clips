"""Httpsonlyredirecthandler: extracted from page_transport.py."""

import urllib.error
import urllib.request
from http.client import HTTPMessage
from typing import IO

MAX_REDIRECTS = 5


class HttpsOnlyRedirectHandler(urllib.request.HTTPRedirectHandler):
    """Re-check the scheme at every hop.

    Checking only the URL the caller passed says nothing about where it ends up,
    and a redirect to `http://` would silently downgrade the fetch.
    """

    max_redirections = MAX_REDIRECTS

    # The six parameters are urllib.request.HTTPRedirectHandler's, not ours:
    # PLR0913/PLR0917 cannot be cleared here without breaking the override.
    def redirect_request(
        self,
        req: urllib.request.Request,
        fp: IO[bytes],
        code: int,
        msg: str,
        headers: HTTPMessage,
        newurl: str,
    ) -> urllib.request.Request | None:
        """Refuse the hop when it leaves https, and otherwise defer to the base class."""
        if not newurl.lower().startswith("https://"):
            raise urllib.error.URLError(f"refusing a non-https redirect to {newurl}")
        return super().redirect_request(req, fp, code, msg, headers, newurl)
