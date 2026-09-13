"""Load a SQL statement stored beside these tools."""

from pathlib import Path


def load_sql(name: str, directory: Path = Path(__file__).parent) -> str:
    """Return the named statement with its original whitespace and placeholders."""
    return (directory / "sql" / f"{name}.sql").read_text()
