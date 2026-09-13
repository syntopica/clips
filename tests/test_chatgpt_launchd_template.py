"""Render the documented template in a synthetic checkout without installing a job."""

import os
import plistlib
import subprocess
import textwrap

from tests.chatgpt_tools_instance import chatgpt_tools_instance
from tests.tool_paths import TOOLS_ROOT


def test_documented_render_passes_the_instance_directory(tmp_path, monkeypatch):
    chatgpt_tools_instance(tmp_path, monkeypatch)
    engine = tmp_path / "engine checkout"
    launchd = engine / "tools/chatgpt/launchd"
    launchd.mkdir(parents=True)
    name = "com.brain.chatgpt-keeper.plist"
    template = (TOOLS_ROOT / "chatgpt/launchd" / f"{name}.template").read_text(encoding="utf-8")
    (launchd / f"{name}.template").write_text(template, encoding="utf-8")
    # Only the render instructions run: the copy and bootstrap lines stay prose.
    commands = textwrap.dedent(
        template[template.index('       template="') : template.index('       cp "')]
    )
    result = subprocess.run(
        ["bash", "-eu", "-c", commands],
        cwd=engine,
        env=os.environ.copy(),
        capture_output=True,
        text=True,
        check=False,
    )
    assert result.returncode == 0, result.stderr
    rendered = (launchd / name).read_bytes()
    job = plistlib.loads(rendered)
    assert job["EnvironmentVariables"]["SYNTOPICA_DATA"] == str(tmp_path / "instance")
    assert job["ProgramArguments"] == ["/bin/bash", str(engine / "tools/chatgpt/keeper.sh")]
    assert job["WorkingDirectory"] == str(engine)
    assert job["StandardOutPath"] == str(tmp_path / ".brain-chatgpt-keeper.launchd.log")
    assert job["StandardErrorPath"] == job["StandardOutPath"]
    assert b"__DATA_ROOT__" not in rendered
    assert b"__ENGINE_ROOT__" not in rendered
    assert b"__WORKSPACE_ROOT__" not in rendered
