# syntopica/clips

The capture and ingest engine for an
[LLM Wiki](https://github.com/syntopica/brain). It takes web pages you clipped,
newsletters you were sent and articles you saved, and turns them into wiki pages
that cite what they came from - through a pipeline whose every step is
checkable, because a synthesis nobody can verify is a rumour with a citation
style.

Your pages, your capture archive and your own scripts live in a data directory
you own. The engine finds them through one file, `syntopica.config.json`, and
knows nothing else about you.

## The pipeline

```
capture        a browser extension, a phone shortcut or a harvest run
   |             records a URL and its extracted text in the archive
   v
triage         a bulk model reads the titles and routes them
   v
screen         a bulk model reads the text and says what is worth a run
   v
ingest         a synthesizer writes pages in a worktree; a validator refuses
   |             anything outside the configured page directories, refuses a
   |             page marked reviewed, and refuses a created page nothing links
   v             to; a person approves the diff
grade          a second model, never the one that wrote the page, checks every
               claim against the clips the page cites
```

Each stage writes its evidence to the archive, so a later run can disagree with
an earlier one without deleting it.

## Commands

```
clips doctor                   paths, repositories and runtime availability
clips pull                     hand the browser clipper's inbox to the archive
clips status                   each clip's derived state and the evidence for it
clips harvest [--promote]      newsletters and saved articles into clips
clips drain                    the phone's captures into the clip store
clips ingest [--clip <id>]     the ingest pipeline
clips grade --page <path>      grade a page against the clips it cites
clips audit                    source drift, unresolved citations, hand edits
clips reconcile --cited        ledger clips the wiki already cites
clips requeue --clip <id>      return an escalated clip to pending
```

`--data <path>` selects an instance explicitly; otherwise `SYNTOPICA_DATA` is
read, and otherwise the command walks upward to the nearest
`syntopica.config.json`, stopping at a repository boundary.

`clips ingest` ends in a fast-forward publication, so a real run requires both
the wiki and the clip archive to be on `main` with an `origin/main` it equals. A
fresh instance has neither; `clips doctor` says so on its `ingest:` line, and
`clips ingest --dry-run` runs without them, fetching nothing and writing
nothing.

## Publishing: the two repositories

Ingest ends by pushing, so the `ingest:` line stays at
`publication not configured yet` until two Git repositories exist and this
instance can push both:

- **the wiki**, the `brain.pages` directory's repository - the data directory
  itself in the ordinary layout, which `syntopica init` created for you;
- **the clip archive**, the `clips.archive` directory's repository, which holds
  the captured text every page cites.

Each needs a first commit, a branch named `main`, and an `origin` remote you can
push to - two private repositories you own, on any host. Nothing here is created
for you, and the destination is deliberately yours to choose: these are your
notes and the articles behind them.

```bash
cd <the archive or the wiki>
git init --initial-branch=main        # skip where init already did this
git add -A && git commit -m "first"
git remote add origin git@github.com:<you>/<repository>.git
git push -u origin main
```

`clips doctor` turns the line to `ingest: ready to publish` once both are on
`main` with an `origin/main` they equal. Until then `clips pull`,
`clips status`, `clips harvest` and `clips ingest --dry-run` all work: capture
and review never needed a remote.

## Models are configuration

`runners` in the instance configuration names which transport runs each stage -
`synthesis`, `grade`, `triage` and `triageRefiner` - and the corresponding
`CLIPS_SYNTHESIS_RUNNER`, `CLIPS_GRADE_RUNNER`, `CLIPS_TRIAGE_RUNNER` and
`CLIPS_TRIAGE_REFINER` override one run through the same loader, so what doctor
reports is what executes. Each takes `codex`, `agy-fine`, `agy-bulk`, `cursor`
or `fallback`, the two-transport pass that degrades on the credit wall.

**An unconfigured stage runs no model.** Synthesis falls to the interactive
synthesizer and says so; grading and triage stop with the fix in the message;
the refinement pass is simply skipped. Until 2026-09-17 these selectors read the
environment directly and an empty configuration reached for agy on its own,
which is how a first run called a transport its owner had never named.

Model identifiers are not configuration yet: which model each transport asks for
is a constant under `src/models/`, and `clips doctor` checks that a configured
transport's command is on PATH, never that it is authenticated or in credit.

The engine enforces one rule of its own: **the model that wrote a page may not
grade it**, pins included. An author asked to verify itself reports clean.

## Untrusted text

Everything this engine reads is captured web content, and a clip is material
under review, never an instruction. The prompts say so, the validator confines
writes to a worktree and to the configured page directories, and no read-only
pass is given permission to run tools. `docs/sandbox-boundary.md` records what
was measured about confining a model transport, including what could not be
confined, and is worth reading before adding one.

## Requirements

Node 22 or newer with pnpm, Python 3.12 with [uv](https://docs.astral.sh/uv/)
for the adapters under `tools/`, and Git.

```bash
pnpm install
pnpm test
pnpm check
```

## Licence

MIT. See `LICENSE`.
