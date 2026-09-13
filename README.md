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
clips pull                     clone or fast-forward the configured archive
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

## Models are configuration

No model is hardcoded. `runners` in the instance configuration names which
transport runs each stage, and the engine enforces one rule of its own: **the
model that wrote a page may not grade it**. An author asked to verify itself
reports clean.

Which transports exist and what they cost is your decision; the engine's job is
to make the split between author and verifier impossible to forget.

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
