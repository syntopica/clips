# review-pass

Re-judges a harvest's Review bucket on the clips' own text instead of on their
titles.

The first triage pass runs before anything is downloaded, so it classifies a
title and sends everything it cannot place to Review - by design, since a wrong
"rejected" loses an article and a wrong "review" costs one line of reading. That
leaves a bucket nobody can clear by hand: 834 entries for the 2026-07-29
harvest. This pass clears it, and it can do what the first one could not,
because the capture-first pipeline has since downloaded the articles: it reads
them.

Nothing here writes to the wiki or to the clip store. The output is one audit
record under `sources/newsletter-triage/`, and the decision it hands back is a
shortlist of `clip_id`s to run `clips ingest --clip <id>` on.

## Running it

Five steps, from the repository root, with a scratch directory of your choosing:

```sh
work=/tmp/review-pass && mkdir -p "$work"
python3 tools/review-pass/extract_review_entries.py \
  sources/newsletter-triage/2026-07-29-not-ingested.md "$work/review.jsonl"
python3 tools/review-pass/map_to_clips.py \
  "$work/review.jsonl" "$work/review-mapped.jsonl"
python3 tools/review-pass/build_batches.py "$work/review-mapped.jsonl" "$work"
zsh tools/review-pass/run-pass.sh "$work"
python3 tools/review-pass/write_audit.py "$work" "$work/review-mapped.jsonl" \
  sources/newsletter-triage/2026-08-02-review-audit.md 2026-07-29 2026-08-02
```

Step 4 is the only one that costs anything: one `codex exec` per batch of 40. It
is resumable - a batch whose verdict file is already non-empty is skipped - so a
failed run costs only what failed. Step 5 refuses to write unless every
candidate has exactly one verdict and no verdict names an id that was never
sent, which is what makes the shortlist's completeness checkable rather than
assumed.

## Why each step is separate

`map_to_clips.py` is the one that decides how much work the pass does, and it
answers two questions from two different sources: **already in the wiki** from
the urls cited by pages (the triage records under `sources/` are excluded, since
they list the whole harvest and would mark everything as known), and **already
captured** from the capture archive's `url-index.sqlite3`. Both compare Medium
post ids, never whole urls, because one post reaches the store under several
spellings - the rule `articleDedupKey` enforces inside the clips CLI.

For the 2026-07-29 harvest that split 834 entries into 430 already cited, 391 to
judge and 13 never captured, which is the first thing the audit reports: the
bucket was mostly not a decision at all.
