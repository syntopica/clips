"""Review pass: extract entries."""

import pytest

from tests.review_pass_load import _load
from tests.tool_paths import TOOLS_ROOT


@pytest.fixture(scope="module")
def extract_entries():
    return _load("extract_review_entries", TOOLS_ROOT / "review-pass" / "extract_review_entries.py")
