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
