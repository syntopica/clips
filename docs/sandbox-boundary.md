# brain-clips

TypeScript package for the brain clip-processing pipeline. Phase 4 of that
pipeline is a synthesis step: turning a clipped web page into wiki-ready
markdown, candidate to run under `codex` rather than a manual Claude pass.

Phase 4 is gated on a boundary decision, recorded in `boundary-decision.json`
and enforced at load time by `readBoundaryDecision`
(`src/sandbox/read-boundary-decision.ts`). Nothing in this package invokes
`codex` in production; the `Synthesizer` interface
(`src/synthesis/synthesizer.ts`) exists so the pipeline depends on a contract,
not on codex, and whether a concrete implementation ever exists is decided by
the probe below.

## The question this package answers

Can the `codex` CLI be confined so that a prompt-injection payload inside an
arbitrary clipped web page cannot read this machine's SSH keys, its own auth
token, or anything outside the worktree it was given?

## The probe

`src/sandbox/` builds a `sandbox-exec` (Seatbelt) profile around a candidate
command, runs a fixed table of nine assertions against it, and classifies each
row as `succeeded`, `denied`, or `inconclusive`. Positive rows (the boundary
must still let real work happen) are judged before negative rows (the boundary
must refuse everything else), because a shell that never started makes every
denial meaningless, not evidence of isolation.

Re-run the plain-command boundary probe (no codex involved) with:

```
pnpm --filter brain-clips test src/sandbox/composed-boundary.integration.test.ts
```

Re-run the codex-in-boundary attempt, which is expected to fail and is kept
`it.skip`'d as the reproducible record of that failure, with:

```
pnpm --filter brain-clips test src/sandbox/codex-in-boundary.integration.test.ts
```

## Evidence: the plain-command boundary holds

The nine-row probe run recorded in `task-4-probe-evidence.json` during
development (that workspace is temporary and will be deleted, so the outcome is
captured here instead):

| Assertion                | Expected  | Result                                                              |
| ------------------------ | --------- | ------------------------------------------------------------------- |
| `shell-starts`           | succeeded | succeeded                                                           |
| `worktree-read`          | succeeded | succeeded                                                           |
| `worktree-write`         | succeeded | succeeded                                                           |
| `clip-read`              | succeeded | succeeded                                                           |
| `outside-read-denied`    | denied    | denied - explicit `Operation not permitted` naming the exact path   |
| `ssh-read-denied`        | denied    | denied - explicit `Operation not permitted` on `~/.ssh`             |
| `codex-home-read-denied` | denied    | denied - explicit `Operation not permitted` on `~/.codex/auth.json` |
| `outside-write-denied`   | denied    | denied - explicit `Operation not permitted` naming the exact path   |
| `network-denied`         | denied    | denied - `curl: (7) ... Couldn't connect to server`                 |

The `network-denied` row is also checked from the other side: a second case in
`src/sandbox/composed-boundary.integration.test.ts` opens the network in the
profile and asserts the row stops reading as denied. A denial assertion is only
evidence if it stops being satisfied once the thing it guards is opened, and
this row failed that check until it was corrected - see the third finding below.

Three findings made this pass, and all are load-bearing for anyone adjusting the
profile in `src/sandbox/seatbelt-profile.ts`:

1. A `(deny default)` profile with only subpath grants aborts every process with
   `SIGABRT` until the root directory entry itself is granted as a literal
   (`(subpath "/")` is not enough by itself; the root entry has to be present
   too). This looks like isolation succeeding - the process never runs - but it
   is a crash, not a denial, and must not be read as evidence.
2. Grants must be written against the realpath of each directory, not the path
   handed in. `/var` and `/tmp` are symlinks into `/private`, and Seatbelt
   matches the canonical path, so a grant written from `mkdtemp`'s
   `/var/folders/...` path matches nothing until it is resolved with
   `realpathSync`.
3. A denial signature belongs to one assertion, never to a shared list. The
   `/etc` grant was inert for the same symlink reason as finding 2, so `curl`
   died reading `/private/etc/ssl/openssl.cnf` and wrote
   `Operation not permitted` - which a shared list credited as a network denial.
   The row reported `denied` with the network _fully open_. It now uses an IP
   rather than a hostname so the probe does not depend on DNS, `-sS` so curl's
   own error survives, and a connection-refusal signature of its own.

This is evidence for the plain-command boundary only. It does not carry over to
codex - see below.

## Decision: codex itself cannot be confined this way

`boundary-decision.json` records `CODEX_DISABLED`. Ten mechanisms were evaluated
in total. Eight of them are read-restricting `sandbox-exec` compositions, and
all eight failed identically: codex exits 1 with
`Error: Operation not permitted (os error 1)` and a backtrace at
`std::fs::File::try_lock`. The remaining two are codex's own configuration
surfaces, not `sandbox-exec` compositions, and did not produce that signature:
`codex-permissions-profile` was evaluated and rejected because codex's
`permissions.<name>` config is honoured but grants no execute permission, so no
binary starts at all; `codex-sandbox-subcommand` was evaluated and rejected
because `codex sandbox` aborts with `SIGABRT` and no output unconditionally in
0.145.0. Two controls passed and rule out nested Seatbelt as the cause of the
eight `try_lock` failures: codex runs fine under `sandbox-exec` with an
`(allow default)` profile, and unsandboxed, in the same scrubbed environment
used everywhere else. The specific resource codex is trying and failing to lock
was never identified, because every diagnostic normally used to find it was
unavailable on this machine (SBPL `trace` writes nothing on macOS 26, the
unified log shows no sandbox violations for these runs, and a `flock` probe
cannot start because the `python3` shim needs developer tools). A further
attempt - a dedicated macOS user account, a container, or an ephemeral VM - was
not tried; it was not attempted and did not fail. Having seen the
composed-sandbox-exec attempt exhausted without a green probe, the human partner
chose to take this negative result rather than fund that further attempt.

`readBoundaryDecision` re-checks the recorded rows rather than trusting the
recorded verdict: a `CODEX_ENABLED` value with no passing rows behind it is
rejected at load time, so this file cannot be hand-edited into a false "enabled"
state.

`boundary-decision.json`'s `reproducibleCommand` field points at the
plain-command boundary probe
(`src/sandbox/composed-boundary.integration.test.ts`), which is green and real,
and exercises the plain-command boundary only - it does not invoke codex. The
codex attempt is preserved un-run, deliberately skipped, at
`src/sandbox/codex-in-boundary.integration.test.ts`, as documented above.

## What this means for the rest of the pipeline

No safe read boundary exists, and none is claimed. On 2026-07-28 the operator
explicitly overrode the CODEX_DISABLED verdict — accepting, in so many words,
that a prompt-injection payload in a clipped page can make codex read anything
this user can read and exfiltrate it through the model channel — because
synthesis on codex quota is worth more to them than that risk. The override is
recorded as `decision: CODEX_OPERATOR_OVERRIDE` in `boundary-decision.json` with
the prior negative result preserved verbatim, and `readBoundaryDecision` accepts
it without probe rows on purpose: there is no boundary to prove, and fabricated
rows would be worse than none.

Escalated the same day at the operator's instruction ("full power"): codex now
runs with `-s danger-full-access`, `--search` and xhigh reasoning - no sandbox
at all. Reads, writes and command network are all open to the codex process,
which also removes the earlier "command network denied" mitigation: a
prompt-injection payload has a direct exfiltration path from the process itself.
What still stands: the CLI stages exclusively validated worktree paths (nothing
codex writes elsewhere ever reaches a brain commit), the hard diff validator,
and a human approving every diff. `clips ingest --manual` bypasses codex
entirely and runs the human/Claude-in-the-loop synthesizer. Re-establishing a
real boundary (dedicated user account, container, VM) remains open in `TODO.md`
as optional hardening.

## Imports

Every relative import specifier in this package uses the literal `.ts`
extension, never `.js`. Node executes this package's TypeScript directly (see
the `clips` script in `package.json`) and does not remap a `.js` specifier onto
a sibling `.ts` file; vitest resolves both spellings, so a wrong specifier
passes the whole test suite and only fails once the CLI actually runs.

## Command contract

Three commands, all reached through `clips <command>`:

| Command  | Effect                                                                                                                                |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `pull`   | Clone or fast-forward `~/p/brain-clips`.                                                                                              |
| `status` | Print each clip's derived state and evidence. Read-only.                                                                              |
| `ingest` | Run the ingest pipeline. Not implemented until plan 2b - the CLI parses the command and exits 1 with "ingest is not implemented yet". |

No build step: `package.json` has no `bin` and no `build` script, and
`turbo.json`'s `build` task has no implementation here. Node strips TypeScript
types natively, so the CLI runs straight from source with `node src/main.ts`.
Reach it through `./tools/clips/clips.sh` (the wrapper the umbrella design
fixes: `pnpm --dir "$(dirname "$0")" clips "$@"`) or
`pnpm --filter brain-clips clips`.

`status` only ever reads; it takes no lock and runs no preflight, because
nothing it does needs one.

### Exit codes

| Code | Meaning                                                    |
| ---- | ---------------------------------------------------------- |
| 0    | Success. Every clip processed or deliberately skipped.     |
| 1    | Fatal local configuration. The run stopped.                |
| 2    | The run completed and at least one clip is `inconsistent`. |
| 3    | The lock is held by a live process. (Used from plan 2b.)   |
| 130  | Interrupted by SIGINT.                                     |

Only `inconsistent` sets exit 2. `unreadable` does not: it is printed on its own
line and counted in the summary, and the process still exits 0. See decision 4
below for why - anyone scripting around `clips status` under `set -e` needs this
before they read the code.

## Decisions that outlive this plan

**1. Invocation: `node src/main.ts`, no build step.** Node strips TypeScript
types natively, so the CLI runs from source. This adds a `clips` script and
keeps zero new dependencies.

**2. Process exit codes** are fixed as above. The design fixes error _codes_ as
strings but no process exit status, and `clips.sh` is useless without them.

**3. `site_extractor` is optional in the copied schema**, unlike the extension's
`ClipMetadataSchema`, which marks it required. Three of the seven real clips
predate the field and lack it entirely, and `schema_version` is still `1` for
all of them, so the version gate cannot see the drift. Do not "fix" this back to
required to match the extension - a verbatim copy rejects those three clips with
a zod parse error and no `UNSUPPORTED_CLIP_SCHEMA` code.

**4. A thin clip is not an error in 2a, and it does not change the exit code.**
The mobile clip (`schema_version: 2`, `index.md` alone) is classified as its own
derived state (`unreadable`) and reported; it is never routed, moved or hashed.
Normalisation is plan 2d. Do not reintroduce a non-zero exit for `unreadable`:
`inconsistent` is the state that says two sources of truth disagree and a human
has to look, `unreadable` says only that this version of the CLI does not read
that shape yet, and counting it as an error makes `clips status` exit non-zero
on every run until plan 2d lands - unusable in a script under `set -e`.

**5. `security/detect-non-literal-fs-filename` is turned off for this package.**
This package's entire job is filesystem and git work on computed paths, so the
rule's signal here is zero; it already accounted for 20 of the 30 pre-plan
ESLint warnings. Turning it off with a recorded reason is the honest resolution.

**`clip_id` is validated as a ULID, not by length.** It is joined into
`.ingest/clips/<clip_id>.json`, and plan 2c writes there; a `min(26)` check
alone would accept a path-traversal payload like
`../../../../../etc/passwd0000000000`. See `src/clips/ulid-pattern.ts`.

## Development

```
pnpm --filter brain-clips test
pnpm --filter brain-clips type-check
```
