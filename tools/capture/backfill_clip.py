"""Backfill clip: extracted from backfill_assets.py."""

import hashlib
import html as html_module
import json
import sqlite3
from collections.abc import Callable
from datetime import UTC, datetime
from functools import partial
from pathlib import Path
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tools.capture.asset_urls import asset_urls
    from tools.capture.clip_result import ClipResult
    from tools.capture.extension_for import extension_for
    from tools.capture.load_sql import load_sql as read_sql
else:
    from asset_urls import asset_urls
    from clip_result import ClipResult
    from extension_for import extension_for
    from load_sql import load_sql as read_sql

load_sql = partial(read_sql, directory=Path(__file__).parent)


def backfill_clip(
    clip_dir: Path,
    connection: sqlite3.Connection,
    dry_run: bool,
    *,
    get_fetch: Callable[[], Callable[..., tuple[bytes | None, str, str | None]]],
) -> ClipResult:
    """Fetch one clip's assets, rewrite its markup, and record every outcome.

    A clip with no `source.html` is skipped rather than failed, and a fetch that
    came back empty still gets an `assets` row: a 404 is evidence about how long
    these links survive.
    """
    fetch = get_fetch()
    html_path = clip_dir / "source.html"
    if not html_path.exists():
        return {"clip": clip_dir.name, "skipped": "no source.html"}
    html = html_path.read_text(errors="ignore")
    urls = asset_urls(html)
    capture_id = clip_dir.name
    if dry_run:
        return {"clip": capture_id, "would_fetch": len(urls)}

    assets_dir = clip_dir / "assets"
    assets_dir.mkdir(exist_ok=True)
    manifest: dict[str, dict[str, str | int]] = {}
    rewritten = html
    ok = failed = 0
    for url in urls:
        body, status, content_type = fetch(url)
        if body is None:
            manifest[url] = {"status": status}
            failed += 1
        else:
            digest = hashlib.sha256(body).hexdigest()
            name = f"{digest}{extension_for(url, content_type)}"
            (assets_dir / name).write_bytes(body)
            manifest[url] = {
                "status": "ok",
                "file": f"assets/{name}",
                "sha256": digest,
                "bytes": len(body),
            }
            # Replace both the raw and the escaped form: the markup holds the
            # escaped one, but a page can carry either.
            local = f"assets/{name}"
            rewritten = rewritten.replace(url, local).replace(
                html_module.escape(url, quote=False), local
            )
            ok += 1
        entry = manifest[url]
        connection.execute(
            load_sql("backfill-clip-1"),
            (
                entry.get("sha256"),
                url,
                capture_id,
                entry.get("bytes"),
                entry["status"],
            ),
        )
    (clip_dir / "assets.json").write_text(
        json.dumps(
            {
                "captured_at": datetime.now(UTC).isoformat(),
                "source": "backfill",
                "assets": manifest,
            },
            indent=2,
        )
        + "\n"
    )
    if ok:
        html_path.write_text(rewritten)
    connection.commit()
    return {"clip": capture_id, "ok": ok, "failed": failed}
