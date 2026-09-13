"""Wiki post ids: extracted from map_to_clips.py."""

import re
import subprocess
from pathlib import Path

POST_ID = re.compile(r"([0-9a-f]{8,14})$")

PAGE_DIRECTORIES = ("topics", "business", "projects", "people", "personal")

MEDIUM_URL = r"https://[a-z0-9.-]*medium\.com/[^ )>\"]+"


def wiki_post_ids(brain: Path) -> set[str]:
    """Return the Medium post ids the wiki's own pages already cite."""
    found = subprocess.run(
        ["grep", "-rhoE", MEDIUM_URL, *PAGE_DIRECTORIES, "index.md", "log.md"],
        cwd=brain,
        capture_output=True,
        text=True,
        check=False,
    ).stdout
    return {match.group(1) for match in (POST_ID.search(url) for url in found.split()) if match}
