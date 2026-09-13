"""The page transport: the https-only rule, the read cap, and what each exit code means.

This script is the drain's whole HTTP surface, and three of its decisions are
security decisions rather than plumbing: the scheme is re-checked at every
redirect hop, the size cap is enforced against what arrives rather than against
`Content-Length`, and the cookie-bearing headers arrive through the environment
so they never reach the process table. Each test below pins one of those.
"""

import gzip
import json
import re
import urllib.error
import urllib.request
from collections.abc import Callable
from http.client import HTTPMessage
from types import ModuleType
from typing import Literal

import pytest

from tests.clips_modules import load_clips_module


@pytest.fixture(scope="module")
def page_transport() -> ModuleType:
    return load_clips_module("page_transport", "capture/page_transport.py")


class FakeResponse:
    """The pieces of an `http.client.HTTPResponse` that `fetch` actually touches."""

    def __init__(self, body: bytes, headers: dict[str, str] | None = None) -> None:
        self.body = body
        self.headers = headers or {}

    def read(self, amount: int | None = None) -> bytes:
        return self.body if amount is None else self.body[:amount]

    def __enter__(self) -> "FakeResponse":
        return self

    def __exit__(self, *exc: object) -> Literal[False]:
        return False


class FakeOpener:
    """Records the one call `fetch` makes, and hands back a canned response."""

    def __init__(self, response: FakeResponse) -> None:
        self.response = response
        self.request: urllib.request.Request | None = None
        self.timeout: float | None = None

    def open(self, request: urllib.request.Request, timeout: float | None = None) -> FakeResponse:
        self.request = request
        self.timeout = timeout
        return self.response


Install = Callable[[FakeResponse], tuple[FakeOpener, list[object]]]


@pytest.fixture
def opener_for(page_transport: ModuleType, monkeypatch: pytest.MonkeyPatch) -> Install:
    """Install a FakeOpener and report which handlers `build_opener` was given."""

    def install(response: FakeResponse) -> tuple[FakeOpener, list[object]]:
        opener = FakeOpener(response)
        handlers: list[object] = []

        def build_opener(*given: object) -> FakeOpener:
            handlers.extend(given)
            return opener

        monkeypatch.setattr(page_transport.urllib.request, "build_opener", build_opener)
        return opener, handlers

    return install


# --- fetch ---------------------------------------------------------------


def test_fetch_returns_the_body_and_sends_the_caller_headers(
    page_transport: ModuleType, opener_for: Install
) -> None:
    opener, _handlers = opener_for(FakeResponse(b"<html>ok</html>"))

    body = page_transport.fetch("https://example.com/a", {"Cookie": "cf_clearance=x"})

    assert body == b"<html>ok</html>"
    assert opener.request is not None
    assert opener.request.full_url == "https://example.com/a"
    assert opener.request.headers == {"Cookie": "cf_clearance=x"}
    assert opener.timeout == page_transport.TIMEOUT_SECONDS


def test_fetch_installs_the_https_only_redirect_handler(
    page_transport: ModuleType, opener_for: Install
) -> None:
    _, handlers = opener_for(FakeResponse(b"ok"))

    page_transport.fetch("https://example.com", {})

    assert page_transport.HttpsOnlyRedirectHandler in handlers


def test_fetch_refuses_a_body_one_byte_past_the_cap(
    page_transport: ModuleType, opener_for: Install
) -> None:
    opener_for(FakeResponse(b"x" * (page_transport.MAX_BYTES + 1)))

    with pytest.raises(ValueError, match=f"exceeds {page_transport.MAX_BYTES} bytes"):
        page_transport.fetch("https://example.com", {})


def test_fetch_accepts_a_body_exactly_at_the_cap(
    page_transport: ModuleType, opener_for: Install
) -> None:
    opener_for(FakeResponse(b"x" * page_transport.MAX_BYTES))

    assert len(page_transport.fetch("https://example.com", {})) == page_transport.MAX_BYTES


def test_fetch_gunzips_only_when_the_response_says_gzip(
    page_transport: ModuleType, opener_for: Install
) -> None:
    packed = gzip.compress(b"unpacked")
    opener_for(FakeResponse(packed, {"Content-Encoding": "gzip"}))
    assert page_transport.fetch("https://example.com", {}) == b"unpacked"

    opener_for(FakeResponse(packed))
    assert page_transport.fetch("https://example.com", {}) == packed


def test_fetch_measures_the_cap_before_decompression(
    page_transport: ModuleType, opener_for: Install
) -> None:
    """Today's behaviour, pinned rather than endorsed: the cap counts wire bytes.

    A small gzip body that expands past MAX_BYTES is returned in full, so the
    cap does not bound what the caller receives. See the note in the report.
    """
    packed = gzip.compress(b"x" * (page_transport.MAX_BYTES + 1024))
    assert len(packed) < page_transport.MAX_BYTES
    opener_for(FakeResponse(packed, {"Content-Encoding": "gzip"}))

    assert len(page_transport.fetch("https://example.com", {})) > page_transport.MAX_BYTES


# --- the redirect handler ------------------------------------------------


def test_redirect_to_http_is_refused_and_the_message_names_the_target(
    page_transport: ModuleType,
) -> None:
    handler = page_transport.HttpsOnlyRedirectHandler()

    with pytest.raises(urllib.error.URLError, match=re.escape("http://evil.example/x")):
        handler.redirect_request(
            urllib.request.Request("https://example.com"),
            None,
            302,
            "Found",
            HTTPMessage(),
            "http://evil.example/x",
        )


def test_redirect_to_a_non_http_scheme_is_refused(page_transport: ModuleType) -> None:
    handler = page_transport.HttpsOnlyRedirectHandler()

    with pytest.raises(urllib.error.URLError):
        handler.redirect_request(
            urllib.request.Request("https://example.com"),
            None,
            302,
            "Found",
            HTTPMessage(),
            "ftp://example.com/x",
        )


def test_an_https_redirect_is_handed_to_the_base_class(
    page_transport: ModuleType, monkeypatch: pytest.MonkeyPatch
) -> None:
    sentinel = urllib.request.Request("https://elsewhere.example/")
    monkeypatch.setattr(
        urllib.request.HTTPRedirectHandler,
        "redirect_request",
        lambda *args, **kwargs: sentinel,
    )
    handler = page_transport.HttpsOnlyRedirectHandler()

    # Upper case too: the scheme check must not be a literal prefix comparison.
    result = handler.redirect_request(
        urllib.request.Request("https://example.com"),
        None,
        302,
        "Found",
        HTTPMessage(),
        "HTTPS://elsewhere.example/",
    )

    assert result is sentinel


def test_the_handler_caps_the_redirect_chain(page_transport: ModuleType) -> None:
    assert page_transport.HttpsOnlyRedirectHandler.max_redirections == page_transport.MAX_REDIRECTS


# --- run -----------------------------------------------------------------


def test_run_refuses_a_non_https_url_without_fetching(
    page_transport: ModuleType,
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
) -> None:
    called: list[object] = []
    monkeypatch.setattr(page_transport, "fetch", lambda *a: called.append(a))
    monkeypatch.setattr(page_transport.sys, "argv", ["p", "http://example.com"])

    assert page_transport.run() == 2
    assert called == []
    assert "refusing a non-https url" in capsys.readouterr().err


def test_run_refuses_an_uppercase_http_scheme(
    page_transport: ModuleType, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(page_transport.sys, "argv", ["p", "HTTP://example.com"])

    assert page_transport.run() == 2


def test_run_writes_the_decoded_page_and_takes_headers_from_the_environment(
    page_transport: ModuleType,
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
) -> None:
    seen: dict[str, object] = {}

    def fetch(url: str, headers: dict[str, str]) -> bytes:
        seen["url"] = url
        seen["headers"] = headers
        return b"<html>hi</html>"

    monkeypatch.setattr(page_transport, "fetch", fetch)
    monkeypatch.setattr(page_transport.sys, "argv", ["p", "https://example.com/a"])
    monkeypatch.setenv("PAGE_HEADERS", json.dumps({"Cookie": "s=1"}))

    assert page_transport.run() == 0
    assert capsys.readouterr().out == "<html>hi</html>"
    assert seen == {"url": "https://example.com/a", "headers": {"Cookie": "s=1"}}


def test_run_replaces_undecodable_bytes_rather_than_failing(
    page_transport: ModuleType,
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
) -> None:
    monkeypatch.setattr(page_transport, "fetch", lambda *a: b"caf\xe9")
    monkeypatch.setattr(page_transport.sys, "argv", ["p", "https://example.com"])
    monkeypatch.setenv("PAGE_HEADERS", "{}")

    assert page_transport.run() == 0
    assert capsys.readouterr().out == "caf�"


def test_run_reports_the_status_code_on_an_http_error(
    page_transport: ModuleType,
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
) -> None:
    def fetch(url: str, headers: dict[str, str]) -> bytes:
        raise urllib.error.HTTPError(url, 403, "Forbidden", HTTPMessage(), None)

    monkeypatch.setattr(page_transport, "fetch", fetch)
    monkeypatch.setattr(page_transport.sys, "argv", ["p", "https://example.com"])
    monkeypatch.setenv("PAGE_HEADERS", "{}")

    assert page_transport.run() == 1
    assert capsys.readouterr().err == "https://example.com returned 403\n"


def test_run_reports_any_other_failure_on_stderr(
    page_transport: ModuleType,
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
) -> None:
    def fetch(url: str, headers: dict[str, str]) -> bytes:
        raise ValueError("response exceeds 16777216 bytes")

    monkeypatch.setattr(page_transport, "fetch", fetch)
    monkeypatch.setattr(page_transport.sys, "argv", ["p", "https://example.com"])
    monkeypatch.setenv("PAGE_HEADERS", "{}")

    assert page_transport.run() == 1
    assert "response exceeds 16777216 bytes" in capsys.readouterr().err


def test_run_reports_a_malformed_headers_environment_variable(
    page_transport: ModuleType,
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
) -> None:
    monkeypatch.setattr(page_transport, "fetch", lambda *a: b"")
    monkeypatch.setattr(page_transport.sys, "argv", ["p", "https://example.com"])
    monkeypatch.setenv("PAGE_HEADERS", "not json")

    assert page_transport.run() == 1
    assert "Expecting value" in capsys.readouterr().err
