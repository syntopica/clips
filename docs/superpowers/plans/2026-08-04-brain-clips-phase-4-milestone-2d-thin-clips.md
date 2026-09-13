# brain-clips ingest CLI, milestone 2d: the thin clips already on disk

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the retention gap left by the two thin mobile captures on disk,
so `clips/` holds a body for every URL the wiki cites, and so a future capture
of either URL is recognised as a duplicate instead of becoming a third
directory.

**This plan is a backfill, not a CLI feature.** That is the change against what
2a and the mobile capture design assumed, and the reason is
`2026-08-04-capture-service-design.md`: the capture service **never writes to
`clips/` at all**, so the mobile lane creates no thin clip directory ever again.
The population this plan serves is closed at two directories and can never grow.

(The first draft of that design reached the same conclusion by having the
service refetch and normalise server-side. The owner cut the fetch the same day
and the premise survived the cut for a different reason - worth knowing, because
the reason written in a plan is what the next reader checks.)

## Where this sits

| Plan   | Delivers                                                                       |
| ------ | ------------------------------------------------------------------------------ |
| 2a     | Foundations, `clips pull`, `clips status`. Shipped.                            |
| 2b     | The lock, preflight, routing, the needs-claude sub-pipeline, `clips ingest`    |
| 2c     | The human synthesizer, the diff validator, review, atomic commit, publication  |
| **2d** | **This plan.** The two thin clips on disk. A one-off pass in `tools/capture/`. |

Authority: `docs/superpowers/specs/2026-08-04-capture-service-design.md` for the
scope, `docs/superpowers/specs/2026-07-28-mobile-capture-design.md` for what a
thin clip is, and `SCHEMA.md` for the retention guarantee this plan repairs.

## What the survey found, and how it reframes the work

Measured 2026-08-04, before writing this plan. Every number below is from the
live store, and three of them contradict what `TODO.md` assumed.

**The two thin clips are already ingested into the wiki.** Both sit under
`clips/processed/`, both have no `state.json` and no ledger under
`brain/.ingest/clips/`, and both are cited as sources by a live page:

| Clip directory              | URL                                  | Cited by                         |
| --------------------------- | ------------------------------------ | -------------------------------- |
| `2026-07-29-050215-mobile/` | Medium, "Stop wasting LLM tokens..." | `topics/llm-wiki.md`             |
| `2026-07-29-045840-mobile/` | Medium, "GLM-5.2 is free right now"  | `topics/open-model-economics.md` |

So this plan does not put content into the brain. The content is already there,
synthesized by hand. What is missing is underneath it.

**One of the two is a duplicate of a full capture that already exists.** The
`-050215-mobile` URL resolves in the URL index to
`clips/processed/2026/07/2026-07-29-medium-com-stop-wasting-llm-tokens-...-01kyq1fc`,
a complete version-1 clip captured by the harvest on the same day. Its body,
`source.html` and assets are on disk. There is nothing to refetch; there are two
directories for one article, which is precisely the duplicate the capture
service's `/have` endpoint exists to prevent, sitting in the store as evidence.

**The other is a genuine hole.** The `-045840-mobile` URL has no row in the URL
index and no full capture anywhere under `clips/`. A live wiki page rests on a
source whose body was never captured, which makes SCHEMA.md's retention
guarantee - "any future retrieval layer can be regenerated from `clips/` without
re-capturing anything" - false for that page today.

**Both carry a malformed `url:`.** A Shortcuts variable label leaked into the
field, so the value spans two lines:

```yaml
url: Imagen
https://nitingavhane.medium.com/glm-5-2-is-free-right-now-...
```

Two captures, two defects. A naive `yaml.safe_load` reads the value as
`Imagen https://...`, which is not a URL and will not fetch. Parsing this is
task 1 and it is the only reason this plan needs code rather than a shell
command.

## Decisions this plan settles

**1. `tools/capture/`, Python, one-off - not a `clips` subcommand.** The input
population is two directories and is closed by the capture service decision.
`recover_gone.py` and `backfill_assets.py` are the precedent: both are one-off
passes over the store, both live here, both are Python because they are
transport-shaped jobs against untrusted remote hosts. Building a
`clips normalize` command with the package's schemas, tests and error taxonomy
would be a permanent interface for a population that will never receive a third
member. If the capture service is never built, this decision is revisited with
the reason visible; nothing about it is hard to undo.

**2. Normalise in place; do not rename the directory.** The rename to the
desktop shape `<date>-<domain>-<slug>-<clip_id[:8]>` was listed as a collision
to resolve. It resolves to "no": the directory name is a path already in git
history and in the clips repository's commits, the desktop shape carries a
`clip_id` prefix that these captures did not have when they were written, and
the name is cosmetic - nothing reads it. `capture_source: ios-shortcut` in the
metadata is what records the lane, and a reader that wants to know looks there.

**3. `schema_version` stays `1` on the normalised clip.** Settled 2026-08-04:
the shape is keyed by `capture_source`, and `schema_version` remains the shape
of the record rather than the shape of the capture. A normalised clip is a
version-1 clip in every respect, so `SUPPORTED_SCHEMA_VERSIONS = [1]` needs no
change and the `UNSUPPORTED_CLIP_SCHEMA` gate never fires. The `2` in the thin
frontmatter is discarded at normalisation, not migrated.

**4. `contentSha256`'s immutability premise survives, because nothing is
rewritten.** The premise is that a clip's files do not change after the ledger
hashes them. Neither thin clip has a ledger, so neither has ever been hashed;
writing the trio creates a clip for the first time rather than mutating one.
This is why the backfill must run before either clip is ever ingested by the
CLI, and it is the reason the plan is worth running now rather than later.

**5. `sensitivity: private`.** Not `public`. The routing table is
`restricted -> manual`, `private -> needs-claude`, `public -> codex candidate`,
and it is deterministic so nothing upstream can lower it. A capture whose
sensitivity was never declared is not evidence that it is public. Both clips are
already synthesized, so this costs nothing today and states the rule for the
recovery case where it would matter.

**6. `--dry-run` prints the plan and touches nothing.** No fetch, no write, no
index row, no commit. This differs from the CLI's `--dry-run`, which may run
codex; there is no model here, so the weaker guarantee has no reason to exist.

**7. Writing to the clips repository uses no temporary branch.** The CLI's
temporary-branch discipline exists because a synthesis can be refused at a
review gate and has to be discardable. A backfill has no gate: it either
produced files or it did not, the operator reads `git diff` before committing,
and a bad run is `git checkout -- .`. Adding a branch dance here would copy a
mechanism away from the problem it solves.

## The duplicate is recorded, not deleted

`-050215-mobile` is the same article as an existing full capture. Three things
could happen to it and only one is consistent with SCHEMA.md.

Deleting it loses the evidence that a duplicate occurred, and that evidence is
the argument for the capture service's `/have` endpoint. Refetching it spends a
request to produce a second copy of bytes already on disk. So: **it stays, and
it gains a pointer.** Its normalised `metadata.json` records
`duplicate_of: <capture_id>` naming the full capture, and the URL index gains no
second row for that URL - the index answers "do we have this?", and the answer
was already yes.

`duplicate_of` is a new field and it is additive: absent on every other clip,
and nothing in the CLI reads it. It exists so a human reading the directory
learns why it holds no `source.html` without having to search the store.

## Tasks

### Task 1: Parse a thin clip's frontmatter, malformed `url` included

**Files:** `tools/capture/normalize_thin_clip.py`

Read the thin `index.md`, extract the frontmatter, and return the fields the
trio needs: `url`, `clipped_at`, `capture_source`, `note`, `tags`.

The `url` field is the whole difficulty. Recover the URL by taking the first
`https://` substring in the value, whether it is on the key's line or on a
continuation line beneath it. Anything before it is a leaked Shortcuts variable
label and is discarded.

**Refuse rather than guess** when the value holds no `https://` at all, or holds
more than one. The population is two clips; a wrong URL here fetches a page that
is not the source of a live wiki page, and no downstream check would catch it.

**Requirements:**

- [ ] Both real clips parse, and the recovered URLs match those cited by
      `topics/llm-wiki.md` and `topics/open-model-economics.md` exactly.
- [ ] A value with no `https://` refuses with the clip path in the message.
- [ ] A value with two `https://` refuses; it does not take the first.
- [ ] The note and tags survive; an empty `note:` becomes `""`, not `None`.

### Task 2: Resolve the clip against the URL index before spending a request

**Files:** `tools/capture/normalize_thin_clip.py`

Normalise the recovered URL with `url_index.py`'s own normalisation - the same
function, imported, not a second copy - and look it up.

Two outcomes, and the branch is the whole point of the task:

- **Hit:** the article is already captured in full. Record
  `duplicate_of: <capture_id>` and skip the fetch entirely.
- **Miss:** the article has no body anywhere. Proceed to task 3.

**Requirements:**

- [ ] `-050215-mobile` resolves to `01KYQ1FCSV39T4YBVT6QCH02QQ` and is marked
      duplicate.
- [ ] `-045840-mobile` misses and is queued for refetch.
- [ ] The normalisation is imported from `url_index.py`; a second implementation
      is a defect, because an index answering a different question than it was
      built from is worse than no index.

### Task 3: Refetch the one genuine miss

**Files:** `tools/capture/normalize_thin_clip.py`

Fetch the article and extract it, reusing the Medium transport at
`tools/clips/src/harvest/medium/medium_transport.py` rather than writing a
second fetcher. Both URLs are Medium-hosted, which is what makes reuse possible
here and not a general answer - a non-Medium thin clip would need the general
path, and there is no non-Medium thin clip.

Outbound-call policy, inherited from the capture service design's refetch
section and applied at the smaller scale: `https` only, redirects capped and
each hop re-validated, a size cap enforced while streaming rather than from
`Content-Length`, and a total timeout budget. The URL comes from an untrusted
capture; that it has sat on disk for a week does not make it trusted.

On failure after the retry budget: write `extractor: refetch-failed` and keep
the capture. The URL and its provenance are the irreducible value.

**Requirements:**

- [ ] The GLM article's body lands as `index.md` with `source.html` beside it.
- [ ] A `410 Gone` writes `refetch-failed` and exits without a traceback,
      because `recover_gone.py` records 29 URLs already lost this way and this
      one is a year-old article on a platform that deletes.
- [ ] No fetch happens for the duplicate.

### Task 4: Write the version-1 trio

**Files:** `tools/capture/normalize_thin_clip.py`

Write `metadata.json` and `state.json` beside the existing `index.md`, in place,
producing a directory the CLI reads as a version-1 clip.

| Field            | Value for a normalised clip                                      |
| ---------------- | ---------------------------------------------------------------- |
| `schema_version` | `1` - decision 3                                                 |
| `clip_id`        | Minted here; a Shortcut cannot make a ULID                       |
| `clipped_from`   | `ios-shortcut`, preserving the lane                              |
| `clipped_at`     | From the thin frontmatter, offset intact - not normalised to UTC |
| `sensitivity`    | `private` - decision 5                                           |
| `extractor`      | `article`, or `refetch-failed`                                   |
| `content_sha256` | Over the refetched body, by the CLI's canonical hash             |
| `duplicate_of`   | Present only on the duplicate                                    |
| `state.json`     | `status: processed`, `failure: null`, `brainCommit: null`        |

`status: processed` rather than `pending` is deliberate and it is the one field
that could cause harm if wrong: both clips are already synthesized into the
wiki, and writing `pending` would offer them to the next `clips ingest` run as
fresh work, producing a second synthesis of an article the wiki already covers.
`brainCommit: null` with `processed` is what 2a's derived-state table calls a
`processed` clip with neither commit nor ledger, and it resolves to
`Inconsistent` - reported, never synthesized, never moved. That is the correct
outcome: a human should look at these two, and no automated pass should touch
them.

**Requirements:**

- [ ] `./tools/clips/clips.sh status` reports both clips as `inconsistent`
      rather than `unreadable`, which is the observable proof that normalisation
      worked.
- [ ] Neither clip is offered for synthesis by a `--dry-run` ingest.
- [ ] `metadata.json` parses against the CLI's copied `ClipMetadataSchema`.

### Task 5: Index rows, then the commit

**Files:** `tools/capture/normalize_thin_clip.py`

Add a `captures` row for the refetched clip. Add none for the duplicate - the
URL already has a row, and a second row for one URL is the state the index
exists to make impossible.

Then stop. **The script does not commit.** The operator reads
`git -C ~/p/brain-clips diff`, sees two directories that gained files and one
index row, and commits. A backfill that writes the store and commits it in the
same breath removes the only review this plan has.

**Requirements:**

- [ ] `url_index.py lookup` on the GLM URL returns the normalised clip.
- [ ] `url_index.py stats` reports 1485 captures, one more than the 1484
      measured today.
- [ ] `url_index.py rebuild` from scratch reproduces the same rows, because the
      index is derived state and a row the rebuild cannot reconstruct is a
      hand-maintained one.

## Acceptance for the whole plan

- [ ] `python3 tools/capture/normalize_thin_clip.py --dry-run` names both clips,
      says which is a duplicate and which needs a fetch, and leaves
      `git -C ~/p/brain-clips status --short` empty.
- [ ] A real run leaves both directories holding the trio.
- [ ] `./tools/clips/clips.sh status` reports zero `unreadable` clips.
- [ ] `python3 tools/capture/url_index.py stats` reports 1485 captures.
- [ ] `grep -rL source.html` over the two directories names only the duplicate.
- [ ] `pnpm run check` is green from the repo root - this plan adds Python and
      touches no TypeScript, so a failure here is a pre-existing one and is
      reported as such.

## What this plan deliberately does not build

- **A CLI normalisation path.** Decision 1. If the capture service is abandoned
  and thin clips resume arriving, this becomes a real feature and this plan is
  the specification for it.
- **A general (non-Medium) refetcher.** Both clips are Medium. The general case
  belongs to the capture service, where the fetch actually lives.
- **`refetch-failed` as a routing state.** The value is written into
  `extractor`, and nothing routes on it. Routing on it would need the error
  taxonomy to gain a category for "the capture is incomplete and always will
  be", which no clip needs today.
- **Deduplication anywhere but here.** `duplicate_of` is written by this pass
  onto one clip. Detecting duplicates at capture time is the capture service's
  `/have` endpoint, and detecting them across the existing store is a different
  pass over 1484 captures that nobody has asked for.

## Amendments

### 2026-08-04 - what running it found

Executed the same day it was written. It works, and three of its statements did
not survive contact with the store.

**The survey was wrong about `state.json`.** It says both clips have none. Both
have one, each recording `status: processed` with
`brainCommit: fa5302deedcb2efaeb239faac51fdab87bce7a8d` - a commit that resolves
in the brain, the hand synthesis that published them. Task 4's
`brainCommit: null` is therefore not written and `state.json` is left untouched:
inventing a null over a true commit manufactures the inconsistency the field was
meant to surface. The consequence is that task 4's observable proof changes.
Both clips are under `processed/`, so `resolveProcessedBucket` answers, and the
derived state is **`reconciled`**, not `inconsistent`. What the plan was really
asking for holds either way - they stop being `unreadable`, which is the number
the acceptance criteria count - and `derivedStateAction` maps `reconciled` to
`skip`, so neither is ever offered for synthesis.

**`extractor: refetch-failed` cannot be written.** Task 3 asks for it and task 4
requires the metadata to parse against `ClipMetadataSchema`, whose `extractor`
is an enum of seven strategies with no such member. The two requirements
contradict each other. Resolution: a refetch that fails leaves the clip thin and
the pass reports it. A `metadata.json` the schema refuses would turn
`unreadable` into a different `unreadable` while looking like progress.

**The plan does touch TypeScript.** It states it adds Python only. But the
Medium session lives in TypeScript - `readMediumCookies` decrypts Chrome's
cookie store, and the Apollo-state extractor is 900 lines beside it - and the
GLM article is member-only, so an anonymous fetch returns the intro. Porting
either to Python would be a second implementation of something already tested.
The refetch therefore goes through a new seam,
`tools/clips/src/harvest/article/capture-medium-article-cli.ts`, which takes a
URL and prints the extracted article plus its source HTML as JSON. The
remote-drift check wanted in the same lane needs exactly this primitive, which
is why it is a file rather than an inline `node -e`.

**`url_index rebuild` needed a change the plan did not foresee.** Task 5
requires the rebuild to reproduce the same rows. Once the duplicate carries a
`metadata.json`, both directories claim the same normalised URL and
`INSERT OR REPLACE` hands the row to whichever sorts last - which was the right
one here by luck, not by rule. `rebuild` now skips any clip carrying
`duplicate_of`, so the decision this plan made is expressed in the code that
derives the index rather than in the alphabet.

One thing deliberately left: the refetched clip's images. `asset_count` is 0 and
`backfill_assets.py` already exists for that pass.
