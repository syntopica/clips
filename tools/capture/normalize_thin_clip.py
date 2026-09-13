"""Turn the two thin mobile captures on disk into version-1 clips.

A one-off backfill, not a CLI feature. The iOS Shortcut used to `PUT` a bare
frontmatter file straight to the GitHub Contents API, which produced a directory
with an `index.md` and nothing else - no `metadata.json`, so `clips status`
reads it as `unreadable` and no page can be traced back to a captured body. The
capture service that replaced that lane never writes to `clips/` at all, so the
population is closed at these two directories and can never grow
(SPEC: docs/superpowers/specs/2026-08-04-capture-service-design.md).

Both are already synthesized into the wiki by hand. What this repairs is
underneath: SCHEMA.md's retention guarantee, that any future retrieval layer can
be regenerated from `clips/` without re-capturing anything.

One of the two is a duplicate of a full harvest capture of the same article on
the same day. It is not deleted and not refetched - it gains a `duplicate_of`
pointer, because it is the evidence that made the capture service's `/have`
endpoint worth building.

PLAN: the 2026-08-04 phase 4 milestone 2d thin-clips plan, under
docs/superpowers/plans/.

Usage:
    normalize_thin_clip.py [--dry-run] [<capture-archive>]
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

import hashlib
import json
import secrets
import sqlite3
import subprocess
from functools import partial
from typing import TYPE_CHECKING, Any
from urllib.parse import urlsplit

if TYPE_CHECKING:
    from tools.capture.build_frontmatter import METADATA_ORDER, build_frontmatter
    from tools.capture.build_metadata import build_metadata
    from tools.capture.capture_article import capture_article
    from tools.capture.clipped_at_milliseconds import clipped_at_milliseconds
    from tools.capture.count_words import count_words
    from tools.capture.default_capture_archive import default_capture_archive
    from tools.capture.duplicate_capture import duplicate_capture
    from tools.capture.frontmatter_block import frontmatter_block
    from tools.capture.frontmatter_fields import frontmatter_fields
    from tools.capture.index_capture import index_capture
    from tools.capture.new_clip_id import new_clip_id
    from tools.capture.normalize_clip import normalize_clip as _normalize_clip
    from tools.capture.normalized_url import normalized_url
    from tools.capture.parse_tags import parse_tags
    from tools.capture.read_thin_clip import read_thin_clip
    from tools.capture.recover_url import recover_url
    from tools.capture.sha256_hex import sha256_hex
    from tools.capture.thin_clip_dirs import thin_clip_dirs
    from tools.capture.thin_clip_error import ThinClipError
    from tools.capture.url_index import connect, normalize
    from tools.capture.write_trio import write_trio
    from tools.capture.yaml_scalar import yaml_scalar
else:
    from build_frontmatter import METADATA_ORDER, build_frontmatter
    from build_metadata import build_metadata
    from capture_article import capture_article
    from clipped_at_milliseconds import clipped_at_milliseconds
    from count_words import count_words
    from default_capture_archive import default_capture_archive
    from duplicate_capture import duplicate_capture
    from frontmatter_block import frontmatter_block
    from frontmatter_fields import frontmatter_fields
    from index_capture import index_capture
    from new_clip_id import new_clip_id
    from normalize_clip import normalize_clip as _normalize_clip
    from normalized_url import normalized_url
    from parse_tags import parse_tags
    from read_thin_clip import read_thin_clip
    from recover_url import recover_url
    from sha256_hex import sha256_hex
    from thin_clip_dirs import thin_clip_dirs
    from thin_clip_error import ThinClipError
    from url_index import connect, normalize
    from write_trio import write_trio
    from yaml_scalar import yaml_scalar

__all__ = [
    "METADATA_ORDER",
    "Any",
    "Path",
    "ThinClipError",
    "build_frontmatter",
    "build_metadata",
    "capture_article",
    "clipped_at_milliseconds",
    "connect",
    "count_words",
    "default_capture_archive",
    "duplicate_capture",
    "frontmatter_block",
    "frontmatter_fields",
    "hashlib",
    "index_capture",
    "json",
    "main",
    "new_clip_id",
    "normalize",
    "normalize_clip",
    "normalized_url",
    "parse_tags",
    "re",
    "read_thin_clip",
    "recover_url",
    "secrets",
    "sha256_hex",
    "sqlite3",
    "subprocess",
    "sys",
    "thin_clip_dirs",
    "urlsplit",
    "write_trio",
    "yaml_scalar",
]

import re

CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"
TOOL_VERSION = "0.1.0"
CLIP_SOURCE = "ios-shortcut"
CAPTURE_CLI = (
    Path(__file__).parents[1]
    / "clips"
    / "src"
    / "harvest"
    / "article"
    / "capture-medium-article-cli.ts"
)
# `(?!//)` is load-bearing: the leaked URL sits on its own continuation line and
# `https:` is a perfectly good key pattern, so without it the URL is read as a
# new field and the `url` value is left holding only the Shortcuts label.
FRONTMATTER_KEY = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*:(?!//)")
# The field order every other clip's frontmatter carries, so a normalised clip
# is byte-comparable with a harvested one.


normalize_clip = partial(
    _normalize_clip, get_capture_article=partial(globals().__getitem__, "capture_article")
)


def main() -> int:
    """Normalise every thin clip in the repository, refusing rather than guessing."""
    arguments = sys.argv[1:]
    dry_run = "--dry-run" in arguments
    positional = [argument for argument in arguments if not argument.startswith("--")]
    repo = Path(positional[0]) if positional else default_capture_archive()

    clips = thin_clip_dirs(repo)
    if not clips:
        print("no thin clips found")
        return 0
    connection = connect(repo)
    failed = 0
    for clip_dir in clips:
        print(clip_dir.relative_to(repo))
        try:
            print(normalize_clip(clip_dir, repo, connection, dry_run))
        except ThinClipError as error:
            failed += 1
            print(f"  refused: {error}", file=sys.stderr)
    if dry_run:
        print("\ndry run: nothing was fetched, written or indexed")
    else:
        print(f"\nread `git -C {repo} diff` before committing")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
