"""Review pass: build batches."""

import pytest

from tests.review_pass_load import _load
from tests.tool_paths import TOOLS_ROOT


@pytest.fixture(scope="module")
def build_batches():
    return _load("build_batches", TOOLS_ROOT / "review-pass" / "build_batches.py")
