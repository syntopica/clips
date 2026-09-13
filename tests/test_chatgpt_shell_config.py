"""Shell entrypoints must reject missing instances before any browser command."""

import os
import subprocess

import pytest

from tests.chatgpt_tools_tools import TOOLS


@pytest.mark.parametrize("script", ["run", "purge", "keeper"])
@pytest.mark.parametrize("config", [None, "{", '{"brain": {"sources": ""}}'])
def test_shell_refuses_missing_or_invalid_instance(tmp_path, script, config):
    environment = os.environ.copy()
    environment.pop("SYNTOPICA_DATA", None)
    environment.pop("CHATGPT_PURGE_CONFIRM", None)
    if config is not None:
        (tmp_path / "syntopica.config.json").write_text(config, encoding="utf-8")
        environment["SYNTOPICA_DATA"] = str(tmp_path)
    before = sorted(tmp_path.rglob("*"))

    result = subprocess.run(
        ["bash", str(TOOLS / f"{script}.sh")],
        cwd=tmp_path,
        env=environment,
        capture_output=True,
        text=True,
        timeout=10,
        check=False,
    )

    assert result.returncode == 78
    assert result.stdout == ""
    assert result.stderr.startswith(f"{script}: SYNTOPICA_DATA")
    assert ("brain.sources" if config is not None else "directory") in result.stderr
    assert sorted(tmp_path.rglob("*")) == before
