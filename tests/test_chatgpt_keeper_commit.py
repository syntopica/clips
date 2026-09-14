"""Exercise the keeper's publication function without starting its browser loop."""

import os
import subprocess

import pytest

from tests.chatgpt_tools_tools import TOOLS


@pytest.mark.parametrize("refuse", [False, True])
def test_keeper_commit_hook(tmp_path, refuse):
    repository = tmp_path / "data"
    repository.mkdir()
    origin = tmp_path / "origin.git"
    subprocess.run(["git", "init", "-q", "--bare", "-b", "main", str(origin)], check=True)
    for arguments in [
        ["init", "-q", "-b", "main"],
        ["config", "user.email", "test@example.com"],
        ["config", "user.name", "Test"],
        ["config", "core.hooksPath", str(repository / ".git" / "hooks")],
        ["remote", "add", "origin", str(origin)],
    ]:
        subprocess.run(["git", "-C", str(repository), *arguments], check=True)
    sources = repository / "sources" / "chatgpt"
    sources.mkdir(parents=True)
    (sources / "conversation.md").write_text("# Conversation\n", encoding="utf-8")
    hook = repository / ".git" / "hooks" / "commit-msg"
    hook.write_text(
        "#!/bin/sh\n"
        + (
            ""
            if refuse
            else "head -n 1 \"$1\" | grep -Eq '^docs\\(chatgpt\\): export [0-9]+ conversations$' && exit 0\n"
        )
        + "echo 'hook refused [type-empty]' >&2\nexit 1\n",
        encoding="utf-8",
    )
    hook.chmod(0o755)
    keeper = (TOOLS / "keeper.sh").read_text(encoding="utf-8")
    publish = keeper.split("publish() {", 1)[1].split("\nwhile true; do", 1)[0]
    environment = {
        **os.environ,
        "DATA": str(repository),
        "DIR": str(TOOLS),
        "CHATGPT_SOURCES": "sources/chatgpt",
        "LOG": str(tmp_path / "keeper.log"),
    }
    result = subprocess.run(
        [
            "bash",
            "-c",
            'say() { printf "%s\\n" "$*" >> "$LOG"; }\npublish() {' + publish + "\npublish 1",
        ],
        cwd=tmp_path,
        env=environment,
        capture_output=True,
        text=True,
        timeout=30,
        check=False,
    )
    if refuse:
        assert result.returncode == 1
        assert "docs(chatgpt): export 1 conversations" in result.stderr
        assert "hook refused [type-empty]" in result.stderr
        assert "staged but uncommitted" in result.stderr
        assert result.stderr.strip() in (tmp_path / "keeper.log").read_text()
        staged = subprocess.check_output(
            ["git", "-C", str(repository), "diff", "--cached", "--name-only"], text=True
        )
        assert staged.strip() == "sources/chatgpt/conversation.md"
        assert "committed" not in result.stdout
    else:
        assert result.returncode == 0, result.stderr
        message = subprocess.check_output(
            ["git", "-C", str(origin), "log", "-1", "--format=%s"], text=True
        )
        assert message.strip() == "docs(chatgpt): export 1 conversations"
        assert (
            subprocess.check_output(["git", "-C", str(repository), "status", "--short"], text=True)
            == ""
        )
