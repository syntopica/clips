# CLAUDE.md

Instructions for a coding agent working on this repository. `README.md` is what
the engine does; this is about changing it.

## The one rule this project exists to keep

**No instance data in the engine.** Not a hostname, not an archive path, not a
capture service origin, not the subject scope a screening model is handed, not a
person's name or address in a test fixture. All of it is configuration: it
belongs in the schema and in the instance's `syntopica.config.json`, read at
call time and never at import.

A default is a value. An archive path under a home directory works on exactly
one machine and fails silently everywhere else - the directory is simply not
there, and the command reports zero of whatever it counts. That failure has a
measured cost here: a test file that generated one case per clip found no clips,
skipped 2001 generated cases and still reported success.

## Author and verifier are never the same model

`clips grade` exists to catch what a synthesis got wrong, which it cannot do if
the same model wrote and read the page. The guard asks who actually wrote it -
the run's recorded identity - not who was configured to, because the synthesizer
selection is overridden in several ways. An unrecognised author refuses every
tier rather than being read as harmless.

## Untrusted input

Clip text is captured web content. Treat it as material under review in every
prompt, keep read-only passes without tool permissions, and confine writes to
the ingest worktree and the configured page directories. When adding a
transport, read `docs/sandbox-boundary.md` first: it records what was measured
about confining one, including the probe that read a file outside its workspace.

## Files

One exported unit per file, one responsibility per unit, every dependency an
explicit import. Types live in their own files; helpers do not live beside their
callers. ESLint runs with `--max-warnings 0`, so a warning is a failure.

## Checks

```bash
pnpm install
pnpm test          # vitest
pnpm check         # type-check, lint, format, dead code, tests
uv run pytest -q   # the Python adapters under tools/
```

A change is finished when those pass, not when the code looks right. State the
command you ran and what it said.

## Prose

English, in code, comments, commit messages and documentation. A comment earns
its place where the reason is not reconstructible from the code: a measured
number, a failure that cost a session, a rule that looks arbitrary until you
know what it prevents. Commit messages are conventional and say what verified
the change.

<!-- tadu:rule v3 -->

## Continuous TODO, Work Log, and History Coverage

Maintain `TODO.md` as the active backlog and `TODO_LOG.md` as the searchable
record of closed work. Use `TODO_HISTORY_INDEX.jsonl`, when present, to avoid
parsing unchanged conversations more than once.

- Read `TODO.md` at the beginning and end of related work. Search `TODO_LOG.md`
  before reopening an old task or repeating a previous solution.
- Record actionable bugs, risks, blockers, deferred work, missing tests,
  validation, documentation, and product improvements as they are discovered.
- Update an existing entry instead of creating a duplicate. Keep entries concise
  and under the most relevant category.
- Use `[ ]` pending, `[~]` partial or unverified, `[!]` blocked, `[x]` verified
  complete, `[-]` obsolete or superseded. Keep blockers in `TODO.md` and name
  the smallest action required to unblock them.
- When work becomes `[x]` or `[-]`, remove it from `TODO.md` and add a dated
  entry to `TODO_LOG.md` under `## YYYY` and `### YYYY-MM` headings, in the
  shape below. An `[x]` entry needs an `Evidence:` line and a `[-]` entry a
  `Resolution:` line, each with content.
- Before reviewing past conversations, consult the history index and skip
  unchanged records already marked `complete` or `irrelevant`. Update a record
  only after its findings are reconciled; interrupted work stays `partial`.
- Do not interrupt the active task for unrelated non-critical work, and do not
  implement unrelated TODO items unless requested. Immediately report critical
  security, destructive, or data-loss findings.

```md
- [x] YYYY-MM-DD — **Category:** What was done.
  - Result: What changed.
  - Evidence: The test, command result, commit or PR that proves it.

- [-] YYYY-MM-DD — **Category:** What was dropped.
  - Resolution: Why it no longer applies, or what replaced it.
```

Close an item with `tadu close --match "<text>" --evidence "<proof>" --write`
(`--resolution` for `[-]`, `--result` for the Result line); it moves the item
and writes the entry in this shape. Run `tadu doctor .` after changing these
files and before committing. If `tadu` is not on PATH, install it with
`uv tool install git+https://github.com/syntopica/tadu`, or report that it is
missing. Format: tadu spec v1,
https://github.com/syntopica/tadu/blob/main/spec/todo-format-v1.md. The
tadu-create and tadu-work skills automate these workflows and are optional.
<!-- /tadu:rule -->
