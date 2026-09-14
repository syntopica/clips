# capture

The capture stage of the three-pipeline design in
`docs/superpowers/specs/2026-07-30-capture-first-pipeline-design.md`: fetch
faithfully first, classify and synthesize later, so a wrong verdict costs a
reclassification pass rather than the artifact.

Python rather than TypeScript because these are transport-shaped jobs against
untrusted remote hosts, the same reason `medium_transport.py` exists inside
`tools/clips`. No dependencies beyond the standard library.

## The URL index

`url_index.py` maintains `url-index.sqlite3` at the root of the clips repository
— the answer to "do we already have this?" before spending a request.

    python3 tools/capture/url_index.py rebuild
    python3 tools/capture/url_index.py lookup <url>
    python3 tools/capture/url_index.py stats

Three tables: `captures` (one row per normalized URL), `assets` (one row per
fetched asset, including the failures), and `unavailable` (URLs known to be
gone, with any archive snapshot found).

Normalization strips query strings and fragments, because Medium appends
tracking and `?source=` provenance to the same article. Verified on the real
store: 365 clip directories collapse to 363 URLs, and the two collisions are the
deliberate X re-clips already documented in the wiki.

The file is derived state — `rebuild` reconstructs it from the clip directories,
which stay the source of truth. It is committed anyway so a fresh clone does not
have to walk every directory before its first capture.

## Publishing the index to the capture service

`push_index_to_service.py` copies what this index knows into the capture service
at `capture.origin`, which is the only store a browser extension can read. The
state comes from each row's `clip_dir`: `pending/` is `captured`, `processed/`
is `ingested`, `needs-claude/` is itself.

    CAPTURE_TOKEN=... python3 tools/capture/push_index_to_service.py --dry-run
    CAPTURE_TOKEN=... python3 tools/capture/push_index_to_service.py --limit 20
    CAPTURE_TOKEN=... python3 tools/capture/push_index_to_service.py

Two requests per row: `POST /api/capture` to get the capture id for the URL,
then `PATCH /api/captures/<id>` with the state and the directory. Both are
idempotent, so re-running is how a mirror that drifted gets repaired — and drift
is expected, since `reconcileClip` pushes each clip's state as it lands and a
service that was down at that moment simply misses one.

The `PATCH` marks each row drained, which is required rather than incidental: an
undrained row is inbox work, and 1485 of them would send `clips drain` off to
promote articles the store already has. Check `GET /api/captures?drained=false`
after a run — it must show only genuine phone captures.

Design:
`~/p/wiki/docs/superpowers/specs/2026-08-04-clip-state-in-the-browser-design.md`.

## Asset backfill

`backfill_assets.py` fetches what a captured page references, writes it to
`assets/<sha256>.<ext>`, rewrites `source.html` to point locally, and records
every asset — successes and failures — in the index.

    python3 tools/capture/backfill_assets.py --dry-run --all
    python3 tools/capture/backfill_assets.py --all [--limit N]
    python3 tools/capture/backfill_assets.py <clip-dir>...

Choices worth knowing before changing it:

- **Save everything.** No allowlist of asset types, no size threshold below 25
  MB. Deleting later is cheap; discovering a gap years later is not.
- **Largest `srcset` candidate only.** The entries are one picture at several
  sizes, so keeping one keeps all the information at a fraction of the bytes,
  and choosing the largest reads an attribute rather than judging an image.
- **Partial capture is success recorded as partial.** A dead image is a line in
  `assets.json`, not a failed clip.
- **URLs are HTML-unescaped before fetching.** An attribute holds `a&amp;b`;
  fetching that reaches a different resource or none. The CDN tolerating it was
  luck, found by running this on real data.

## Recovery

`recover_gone.py` is a one-off pass over the `[gone-410]` markers in the triage
files, querying the Wayback availability API and recording the outcome.

It is deliberately **not** part of the capture path: capture must not depend on
third parties, since that dependency is the failure this design removes. For
URLs already lost, an archive is strictly better than nothing.

Result on 2026-07-30: **10 gone URLs, 0 in the archive, 10 unrecoverable** — and
they belong to only three author accounts, so these were bulk account removals
rather than individual retractions. That is the measured cost of classifying
before capturing.

## Classification verdicts

`classifications.py` keeps verdicts in
`classifications/<yyyy-mm-dd>/<run-id>.jsonl` inside the clips repository —
outside the captures they describe, because a verdict is an opinion formed by
one model with one prompt at one moment, and writing it into the captured
directory would mean reclassifying rewrites the artifact.

    python3 tools/capture/classifications.py import-triage
    python3 tools/capture/classifications.py latest [--bucket ingest]
    python3 tools/capture/classifications.py runs

Append-only, one file per run. A better model or a corrected prompt produces a
new run beside the old one, and `latest` resolves the current verdict per
capture by run date. Every row records `model` and `prompt_sha256`, so a
calibration audit like the 2026-07-30 one becomes a query instead of a manual
reconstruction.

Run zero is imported from the triage markdown so no history is lost: **1,471
verdicts — 363 ingest, 788 review, 310 rejected, 10 unavailable** — which
reconciles exactly with the harvest total and with the 63 entries the audit
rescued (834 review minus 46, 327 rejected minus 17).

One bug worth remembering if the parser is ever touched: the triage output has
two line shapes, `- [x] [Title](url)` and an unmarked `- [Title](url)`. The
first version of the regex required the marker and **silently dropped all 327
rejected entries**. The count reconciling against the harvest total is what
caught it.

## Classification verdicts

`classifications.py` keeps verdicts in
`classifications/<yyyy-mm-dd>/<run-id>.jsonl` inside the clips repository —
outside the captures they describe, because a verdict is an opinion formed by
one model with one prompt at one moment, and writing it into the captured
directory would mean reclassifying rewrites the artifact.

    python3 tools/capture/classifications.py import-triage
    python3 tools/capture/classifications.py latest [--bucket ingest]
    python3 tools/capture/classifications.py runs

Append-only, one file per run. A better model or a corrected prompt produces a
new run beside the old one, and `latest` resolves the current verdict per
capture by run date. Every row records `model` and `prompt_sha256`, so a
calibration audit like the 2026-07-30 one becomes a query instead of a manual
reconstruction.

Run zero is imported from the triage markdown so no history is lost: **1,471
verdicts — 363 ingest, 788 review, 310 rejected, 10 unavailable** — reconciling
exactly with the harvest total and with the 63 entries the audit rescued (834
review minus 46, 327 rejected minus 17).

One bug worth remembering if the parser is touched: the triage output has two
line shapes, `- [x] [Title](url)` and an unmarked `- [Title](url)`. The first
regex required the marker and **silently dropped all 327 rejected entries**. The
count failing to reconcile against the harvest total is what caught it.
