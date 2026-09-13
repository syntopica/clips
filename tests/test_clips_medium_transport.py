"""The Medium transport: which argv mode POSTs, where the headers come from, and what fails.

This script is deliberately the smallest thing that must run outside TypeScript,
so almost all of its behaviour is argument handling: `get` versus `post` decides
whether stdin is read at all, and the cookie-bearing headers arrive through
MEDIUM_HEADERS so they never appear in the process table. Three of the tests
pin differences from the sibling page transport rather than endorsing them.
"""

import gzip
import io
import json
import urllib.error
import urllib.request
from collections.abc import Callable
from http.client import HTTPMessage
from types import ModuleType
from typing import Literal

import pytest

from tests.clips_modules import load_clips_module

EXPECTED_TIMEOUT_SECONDS = 60


@pytest.fixture(scope="module")
def medium_transport() -> ModuleType:
    return load_clips_module("medium_transport", "harvest/medium/medium_transport.py")


class FakeResponse:
    """The pieces of an `http.client.HTTPResponse` that `run` actually touches."""

    def __init__(self, body: bytes, headers: dict[str, str] | None = None) -> None:
        self.body = body
        self.headers = headers or {}

    def read(self) -> bytes:
        return self.body

    def __enter__(self) -> "FakeResponse":
        return self

    def __exit__(self, *exc: object) -> Literal[False]:
        return False


class Recorder:
    """What `urlopen` was called with, once `run` has called it."""

    def __init__(self) -> None:
        self.request: urllib.request.Request | None = None
        self.timeout: float | None = None

    def seen(self) -> urllib.request.Request:
        assert self.request is not None
        return self.request


InstallUrlopen = Callable[[FakeResponse | Exception], Recorder]
InstallStdin = Callable[[bytes], None]


@pytest.fixture
def urlopen_for(medium_transport: ModuleType, monkeypatch: pytest.MonkeyPatch) -> InstallUrlopen:
    """Replace urlopen with a recorder, and report what the request looked like."""

    def install(result: FakeResponse | Exception) -> Recorder:
        recorder = Recorder()

        def urlopen(request: urllib.request.Request, timeout: float | None = None) -> FakeResponse:
            recorder.request = request
            recorder.timeout = timeout
            if isinstance(result, Exception):
                raise result
            return result

        monkeypatch.setattr(medium_transport.urllib.request, "urlopen", urlopen)
        return recorder

    return install


@pytest.fixture
def stdin_bytes(medium_transport: ModuleType, monkeypatch: pytest.MonkeyPatch) -> InstallStdin:
    """Feed `sys.stdin.buffer` a fixed payload."""

    def install(payload: bytes) -> None:
        class FakeStdin:
            buffer = io.BytesIO(payload)

        monkeypatch.setattr(medium_transport.sys, "stdin", FakeStdin)

    return install


def argv(medium_transport: ModuleType, monkeypatch: pytest.MonkeyPatch, *args: str) -> None:
    monkeypatch.setattr(medium_transport.sys, "argv", ["medium_transport.py", *args])


def test_get_sends_no_body_and_writes_the_response(
    medium_transport: ModuleType,
    monkeypatch: pytest.MonkeyPatch,
    urlopen_for: InstallUrlopen,
    capsys: pytest.CaptureFixture[str],
) -> None:
    recorder = urlopen_for(FakeResponse(b'{"data":1}'))
    argv(medium_transport, monkeypatch, "get", "https://medium.com/@a/post")
    monkeypatch.setenv("MEDIUM_HEADERS", json.dumps({"Cookie": "sid=1"}))

    assert medium_transport.run() == 0
    assert capsys.readouterr().out == '{"data":1}'
    assert recorder.seen().data is None
    assert recorder.seen().get_method() == "GET"
    assert recorder.seen().full_url == "https://medium.com/@a/post"


def test_post_sends_stdin_as_the_request_body(
    medium_transport: ModuleType,
    monkeypatch: pytest.MonkeyPatch,
    urlopen_for: InstallUrlopen,
    stdin_bytes: InstallStdin,
    capsys: pytest.CaptureFixture[str],
) -> None:
    recorder = urlopen_for(FakeResponse(b"{}"))
    stdin_bytes(b'{"query":"{me{id}}"}')
    argv(medium_transport, monkeypatch, "post", "https://medium.com/_/graphql")
    monkeypatch.setenv("MEDIUM_HEADERS", "{}")

    assert medium_transport.run() == 0
    assert recorder.seen().data == b'{"query":"{me{id}}"}'
    assert recorder.seen().get_method() == "POST"
    capsys.readouterr()


def test_the_mode_is_matched_exactly_so_uppercase_post_sends_no_body(
    medium_transport: ModuleType,
    monkeypatch: pytest.MonkeyPatch,
    urlopen_for: InstallUrlopen,
    capsys: pytest.CaptureFixture[str],
) -> None:
    """Today's behaviour, pinned: only the literal lowercase `post` reads stdin."""
    recorder = urlopen_for(FakeResponse(b""))
    argv(medium_transport, monkeypatch, "POST", "https://medium.com/_/graphql")
    monkeypatch.setenv("MEDIUM_HEADERS", "{}")

    assert medium_transport.run() == 0
    assert recorder.seen().data is None
    capsys.readouterr()


def test_headers_come_from_the_environment_not_from_argv(
    medium_transport: ModuleType,
    monkeypatch: pytest.MonkeyPatch,
    urlopen_for: InstallUrlopen,
    capsys: pytest.CaptureFixture[str],
) -> None:
    recorder = urlopen_for(FakeResponse(b""))
    argv(medium_transport, monkeypatch, "get", "https://medium.com/x")
    monkeypatch.setenv("MEDIUM_HEADERS", json.dumps({"Cookie": "cf_clearance=placeholder"}))

    assert medium_transport.run() == 0
    assert recorder.seen().get_header("Cookie") == "cf_clearance=placeholder"
    assert "cf_clearance" not in " ".join(medium_transport.sys.argv)
    capsys.readouterr()


def test_the_request_carries_a_timeout(
    medium_transport: ModuleType,
    monkeypatch: pytest.MonkeyPatch,
    urlopen_for: InstallUrlopen,
    capsys: pytest.CaptureFixture[str],
) -> None:
    recorder = urlopen_for(FakeResponse(b""))
    argv(medium_transport, monkeypatch, "get", "https://medium.com/x")
    monkeypatch.setenv("MEDIUM_HEADERS", "{}")

    medium_transport.run()

    assert recorder.timeout == EXPECTED_TIMEOUT_SECONDS
    capsys.readouterr()


def test_a_gzip_response_is_unpacked_and_a_plain_one_is_not(
    medium_transport: ModuleType,
    monkeypatch: pytest.MonkeyPatch,
    urlopen_for: InstallUrlopen,
    capsys: pytest.CaptureFixture[str],
) -> None:
    urlopen_for(FakeResponse(gzip.compress(b"unpacked"), {"Content-Encoding": "gzip"}))
    argv(medium_transport, monkeypatch, "get", "https://medium.com/x")
    monkeypatch.setenv("MEDIUM_HEADERS", "{}")
    assert medium_transport.run() == 0
    assert capsys.readouterr().out == "unpacked"

    urlopen_for(FakeResponse(b"plain"))
    assert medium_transport.run() == 0
    assert capsys.readouterr().out == "plain"


def test_undecodable_bytes_are_replaced_rather_than_raising(
    medium_transport: ModuleType,
    monkeypatch: pytest.MonkeyPatch,
    urlopen_for: InstallUrlopen,
    capsys: pytest.CaptureFixture[str],
) -> None:
    urlopen_for(FakeResponse(b"caf\xe9"))
    argv(medium_transport, monkeypatch, "get", "https://medium.com/x")
    monkeypatch.setenv("MEDIUM_HEADERS", "{}")

    assert medium_transport.run() == 0
    assert capsys.readouterr().out == "caf�"


def test_an_http_error_reports_the_status_and_exits_one(
    medium_transport: ModuleType,
    monkeypatch: pytest.MonkeyPatch,
    urlopen_for: InstallUrlopen,
    capsys: pytest.CaptureFixture[str],
) -> None:
    urlopen_for(
        urllib.error.HTTPError("https://medium.com/x", 403, "Forbidden", HTTPMessage(), None)
    )
    argv(medium_transport, monkeypatch, "get", "https://medium.com/x")
    monkeypatch.setenv("MEDIUM_HEADERS", "{}")

    assert medium_transport.run() == 1
    assert capsys.readouterr().err == "https://medium.com/x returned 403\n"


def test_a_transport_level_failure_is_not_caught(
    medium_transport: ModuleType,
    monkeypatch: pytest.MonkeyPatch,
    urlopen_for: InstallUrlopen,
) -> None:
    """Today's behaviour, pinned: only HTTPError is handled, so a DNS or TLS failure escapes.

    The sibling page transport catches these and returns 1; this one raises out
    of `run` and the caller sees a traceback. See the note in the report.
    """
    urlopen_for(urllib.error.URLError("dns failure"))
    argv(medium_transport, monkeypatch, "get", "https://medium.com/x")
    monkeypatch.setenv("MEDIUM_HEADERS", "{}")

    with pytest.raises(urllib.error.URLError):
        medium_transport.run()


def test_a_plain_http_url_is_not_refused(
    medium_transport: ModuleType,
    monkeypatch: pytest.MonkeyPatch,
    urlopen_for: InstallUrlopen,
    capsys: pytest.CaptureFixture[str],
) -> None:
    """Today's behaviour, pinned: this transport has no https-only rule at all."""
    recorder = urlopen_for(FakeResponse(b"ok"))
    argv(medium_transport, monkeypatch, "get", "http://medium.com/x")
    monkeypatch.setenv("MEDIUM_HEADERS", "{}")

    assert medium_transport.run() == 0
    assert recorder.seen().full_url == "http://medium.com/x"
    capsys.readouterr()


def test_a_missing_headers_variable_raises_rather_than_sending_none(
    medium_transport: ModuleType,
    monkeypatch: pytest.MonkeyPatch,
    urlopen_for: InstallUrlopen,
) -> None:
    urlopen_for(FakeResponse(b""))
    argv(medium_transport, monkeypatch, "get", "https://medium.com/x")
    monkeypatch.delenv("MEDIUM_HEADERS", raising=False)

    with pytest.raises(KeyError, match="MEDIUM_HEADERS"):
        medium_transport.run()
