"""Review pass: map to clips."""

import pytest

from tests.review_pass_load import _load
from tests.tool_paths import TOOLS_ROOT


@pytest.fixture(scope="module")
def map_to_clips():
    return _load("map_to_clips", TOOLS_ROOT / "review-pass" / "map_to_clips.py")
