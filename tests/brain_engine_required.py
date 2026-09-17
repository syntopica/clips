"""Skip marker for tests that need the brain engine's Python reader."""

from pathlib import Path

import pytest

from tests.brain_engine_path import brain_engine_path

BRAIN_ENGINE_REQUIRED = pytest.mark.skipif(
    brain_engine_path(Path(__file__).resolve().parents[1]) is None,
    reason="no brain engine checkout here; the review-pass adapters read the instance through it",
)
