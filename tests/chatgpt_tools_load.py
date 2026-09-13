"""Chatgpt tools: load."""

import importlib.util
import sys
from types import ModuleType

from tests.chatgpt_tools_tools import TOOLS


def load(name: str) -> ModuleType:
    """Import one tool by path under a unique name.

    The tools are scripts, not a package - `convert.py` exists twice under
    `tools/` - so they are loaded by location and registered under a prefixed
    name that cannot collide with a sibling or with the stdlib `queue`.
    """
    spec = importlib.util.spec_from_file_location(f"chatgpt_{name}", TOOLS / f"{name}.py")
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module
