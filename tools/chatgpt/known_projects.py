"""Known projects: extracted from triage.py."""

from pathlib import Path


def known_projects(source_dir: Path) -> list[str]:
    """The wiki's project page stems, offered to the model as the allowed set."""
    projects = source_dir.parent.parent / "projects"
    return sorted(page.stem for page in projects.glob("*.md"))
