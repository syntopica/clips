# Phase 4 Milestone 1: the codex execution boundary decision

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Decide, reproducibly and in a binary way, whether codex can synthesize
brain pages from untrusted clips without being able to read outside an explicit
set of roots - and record that decision as an artifact the pipeline cannot
override.

**Architecture:** A probe harness runs a fixed table of assertions against a
candidate execution boundary and classifies each row from the **child process's
own exit status**, never from any model's account of what happened. Rows
expected to succeed are evaluated first: if the shell never starts, every denial
is meaningless and the whole probe fails. The verdict is written to a committed
decision file whose loader re-checks the recorded rows, so an enabled verdict
that no probe justifies is rejected rather than believed.

**Tech Stack:** TypeScript 7, Node 26, pnpm 11, vitest 4, zod 4, macOS
`sandbox-exec` (Seatbelt), codex-cli 0.145.0.

**Spec:**
`docs/superpowers/specs/2026-07-27-brain-clips-ingest-cli-design-rev2.md`

## Why this milestone is alone

Measured findings in the spec show `codex exec -s workspace-write` leaves
filesystem reads unrestricted: a probe read a canary outside the workspace and
listed all of `~/.ssh`. Every other part of phase 4 - routing, git recovery,
validation, review, publication, reconciliation - is written against a pipeline
whose synthesizer is not yet known to exist. Building them now would let the
plan crystallize around an assumption this milestone exists to test.

**Nothing outside this document may be implemented until it produces
`CODEX_ENABLED` or `CODEX_DISABLED`.**

The one exception is the package skeleton the probe itself needs
(`package.json`, `tsconfig.json`, `vitest.config.ts`). That is the probe's own
scaffolding, folded into the task that needs it. It is **not** CLI scaffolding:
no commands, no routing, no git layer, no clip schemas.

## Global Constraints

- English in every artifact: source, comments, identifiers, commit messages,
  docs. No exceptions.
- No assistant attribution anywhere: no co-author trailers, no generated-by
  footers, no mention of Claude, Anthropic, or AI in commits.
- Atomic File Rule: one file = one exported unit = one responsibility. No
  private helpers, no `utils.ts`, no grouped modules. Every dependency is an
  explicit import.
- ASCII only in source and docs. Straight quotes, ASCII hyphens, no NBSP or
  zero-width characters.
- The probe classifies from child process exit status and stderr. A probe row
  that reports what a model said it observed is not a valid assertion.
- No real clip is processed in this milestone. The probe runs against synthetic
  fixtures only.
- Partial isolation is a failure. There is no `workspace-write`-only fallback
  and no way to enable codex from a probe that did not pass.

## File Structure

```
brain/tools/clips/
  package.json                              # pnpm package, type: module
  tsconfig.json
  vitest.config.ts
  src/sandbox/probe-assertion.ts            # ProbeAssertion type + PROBE_ASSERTIONS table
  src/sandbox/probe-command-result.ts       # ProbeCommandResult type
  src/sandbox/probe-outcome.ts              # ProbeOutcome union
  src/sandbox/run-probe-command.ts          # spawn under a boundary, capture exit status
  src/sandbox/classify-probe-result.ts      # ProbeCommandResult -> ProbeOutcome
  src/sandbox/evaluate-probe.ts             # rows -> verdict, positive rows guard first
  src/sandbox/seatbelt-profile.ts           # build the SBPL profile text
  src/sandbox/composed-boundary.ts          # wrap a command in sandbox-exec
  src/sandbox/scrubbed-environment.ts       # the environment handed to the boundary
  src/sandbox/boundary-decision-schema.ts   # zod schema for the decision artifact
  src/sandbox/read-boundary-decision.ts     # load + validate the artifact
  src/synthesis/synthesizer.ts              # neutral Synthesizer interface
  tests/sandbox/*.test.ts
  boundary-decision.json                    # committed artifact, written by Task 6
  README.md
```

`node_modules/` and `tools/clips/dist/` are added to the brain repo's
`.gitignore` in Task 1.

---

### Task 1: Package skeleton and the probe assertion table

**Files:**

- Create: `tools/clips/package.json`
- Create: `tools/clips/tsconfig.json`
- Create: `tools/clips/vitest.config.ts`
- Create: `tools/clips/src/sandbox/probe-outcome.ts`
- Create: `tools/clips/src/sandbox/probe-assertion.ts`
- Modify: `.gitignore`
- Test: `tools/clips/tests/sandbox/probe-assertion.test.ts`

**Interfaces:**

- Consumes: nothing.
- Produces: `type ProbeOutcome = 'succeeded' | 'denied' | 'inconclusive'`;
  `interface ProbeAssertion { id: string; description: string; expected: 'succeeded' | 'denied'; command: (paths: ProbePaths) => string[] }`;
  `interface ProbePaths { worktree: string; clipInput: string; canaryFile: string; homeDirectory: string; codexHome: string; outsideWritePath: string }`;
  `const PROBE_ASSERTIONS: readonly ProbeAssertion[]`.

- [ ] **Step 1: Create the package skeleton**

`tools/clips/package.json`:

```json
{
  "name": "brain-clips",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "@types/node": "^26.1.1",
    "typescript": "^7.0.2",
    "vitest": "^4.1.10",
    "zod": "^4.4.3"
  }
}
```

`tools/clips/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2023",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noEmit": true,
    "types": ["node"],
    "verbatimModuleSyntax": true
  },
  "include": ["src", "tests"]
}
```

`tools/clips/vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    testTimeout: 30_000,
  },
})
```

Append to the brain repo's `.gitignore`:

```
# Node tooling for tools/clips
node_modules/
tools/clips/dist/
```

- [ ] **Step 2: Install dependencies**

Run: `pnpm --dir tools/clips install` Expected: lockfile created, no errors.

- [ ] **Step 3: Write the failing test**

`tools/clips/tests/sandbox/probe-assertion.test.ts`:

```typescript
import { describe, expect, it } from 'vitest'
import { PROBE_ASSERTIONS } from '../../src/sandbox/probe-assertion.js'

const PATHS = {
  worktree: '/tmp/wt',
  clipInput: '/tmp/clip',
  canaryFile: '/tmp/outside/canary.txt',
  homeDirectory: '/Users/someone',
  codexHome: '/tmp/codex-home',
  outsideWritePath: '/tmp/outside/written',
}

describe('PROBE_ASSERTIONS', () => {
  it('covers every row the spec requires', () => {
    expect(PROBE_ASSERTIONS.map((row) => row.id)).toEqual([
      'shell-starts',
      'worktree-read',
      'worktree-write',
      'clip-read',
      'outside-read-denied',
      'ssh-read-denied',
      'codex-home-read-denied',
      'outside-write-denied',
      'network-denied',
    ])
  })

  it('expects the positive rows to succeed and the isolation rows to be denied', () => {
    const expectations = Object.fromEntries(
      PROBE_ASSERTIONS.map((row) => [row.id, row.expected]),
    )
    expect(expectations['shell-starts']).toBe('succeeded')
    expect(expectations['worktree-write']).toBe('succeeded')
    expect(expectations['clip-read']).toBe('succeeded')
    expect(expectations['outside-read-denied']).toBe('denied')
    expect(expectations['ssh-read-denied']).toBe('denied')
    expect(expectations['network-denied']).toBe('denied')
  })

  it('builds concrete argv from the supplied paths', () => {
    const clipRead = PROBE_ASSERTIONS.find((row) => row.id === 'clip-read')
    expect(clipRead?.command(PATHS)).toEqual(['/bin/cat', '/tmp/clip/index.md'])
  })

  it('never references the home directory except in the denial rows', () => {
    for (const row of PROBE_ASSERTIONS) {
      if (row.expected === 'succeeded') {
        expect(row.command(PATHS).join(' ')).not.toContain(PATHS.homeDirectory)
      }
    }
  })
})
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `pnpm --dir tools/clips test` Expected: FAIL, cannot resolve
`../../src/sandbox/probe-assertion.js`.

- [ ] **Step 5: Write the outcome type**

`tools/clips/src/sandbox/probe-outcome.ts`:

```typescript
/**
 * How a probe command ended, judged from the child process alone.
 *
 * `inconclusive` is deliberately distinct from `denied`: a command that timed
 * out, was killed by a signal, or failed without a recognisable denial
 * signature tells us nothing about isolation, and must never be counted as
 * evidence that the boundary held.
 */
export type ProbeOutcome = 'succeeded' | 'denied' | 'inconclusive'
```

- [ ] **Step 6: Write the assertion table**

`tools/clips/src/sandbox/probe-assertion.ts`:

```typescript
export interface ProbePaths {
  worktree: string
  clipInput: string
  canaryFile: string
  homeDirectory: string
  codexHome: string
  outsideWritePath: string
}

export interface ProbeAssertion {
  id: string
  description: string
  expected: 'succeeded' | 'denied'
  command: (paths: ProbePaths) => string[]
}

/**
 * The rows are ordered deliberately: every `succeeded` row comes before every
 * `denied` row, because a denial only carries information once the shell has
 * been shown to start and the worktree to be usable.
 */
export const PROBE_ASSERTIONS: readonly ProbeAssertion[] = [
  {
    id: 'shell-starts',
    description: 'a shell runs inside the boundary at all',
    expected: 'succeeded',
    command: () => ['/bin/sh', '-c', 'exit 0'],
  },
  {
    id: 'worktree-read',
    description: 'the worktree is readable',
    expected: 'succeeded',
    command: (paths) => ['/bin/cat', `${paths.worktree}/SCHEMA.md`],
  },
  {
    id: 'worktree-write',
    description: 'the worktree is writable',
    expected: 'succeeded',
    command: (paths) => ['/usr/bin/touch', `${paths.worktree}/probe-write`],
  },
  {
    id: 'clip-read',
    description: 'the selected clip is readable',
    expected: 'succeeded',
    command: (paths) => ['/bin/cat', `${paths.clipInput}/index.md`],
  },
  {
    id: 'outside-read-denied',
    description: 'a canary outside the allowed roots is unreadable',
    expected: 'denied',
    command: (paths) => ['/bin/cat', paths.canaryFile],
  },
  {
    id: 'ssh-read-denied',
    description: 'the ssh directory is unreadable',
    expected: 'denied',
    command: (paths) => ['/bin/ls', `${paths.homeDirectory}/.ssh`],
  },
  {
    id: 'codex-home-read-denied',
    description: 'the real codex home is unreadable',
    expected: 'denied',
    command: (paths) => ['/bin/cat', `${paths.codexHome}/auth.json`],
  },
  {
    id: 'outside-write-denied',
    description: 'writing outside the worktree fails',
    expected: 'denied',
    command: (paths) => ['/usr/bin/touch', paths.outsideWritePath],
  },
  {
    id: 'network-denied',
    description: 'a network request from inside the boundary fails',
    expected: 'denied',
    command: () => ['/usr/bin/curl', '-s', '-m', '5', 'https://example.com'],
  },
]
```

- [ ] **Step 7: Run the tests to verify they pass**

Run: `pnpm --dir tools/clips test` Expected: PASS, 4 tests.

- [ ] **Step 8: Typecheck**

Run: `pnpm --dir tools/clips typecheck` Expected: no output, exit 0.

- [ ] **Step 9: Commit**

```bash
git add .gitignore tools/clips
git commit -m "Add the probe assertion table for the codex execution boundary"
```

---

### Task 2: Run a command under a boundary and capture its exit status

**Files:**

- Create: `tools/clips/src/sandbox/probe-command-result.ts`
- Create: `tools/clips/src/sandbox/run-probe-command.ts`
- Test: `tools/clips/tests/sandbox/run-probe-command.test.ts`

**Interfaces:**

- Consumes: nothing from Task 1.
- Produces:
  `interface ProbeCommandResult { exitCode: number | null; signal: string | null; stdout: string; stderr: string; timedOut: boolean }`;
  `type Boundary = (command: string[]) => { argv: string[]; env: Record<string, string> }`;
  `function runProbeCommand(command: string[], boundary: Boundary, timeoutMs: number): Promise<ProbeCommandResult>`.

- [ ] **Step 1: Write the failing test**

`tools/clips/tests/sandbox/run-probe-command.test.ts`:

```typescript
import { describe, expect, it } from 'vitest'
import { runProbeCommand } from '../../src/sandbox/run-probe-command.js'

const PASSTHROUGH = (command: string[]) => ({ argv: command, env: {} })

describe('runProbeCommand', () => {
  it('captures a zero exit status and stdout', async () => {
    const result = await runProbeCommand(
      ['/bin/echo', 'hello'],
      PASSTHROUGH,
      5_000,
    )
    expect(result.exitCode).toBe(0)
    expect(result.stdout.trim()).toBe('hello')
    expect(result.timedOut).toBe(false)
  })

  it('captures a non-zero exit status and stderr', async () => {
    const result = await runProbeCommand(
      ['/bin/sh', '-c', 'echo boom >&2; exit 3'],
      PASSTHROUGH,
      5_000,
    )
    expect(result.exitCode).toBe(3)
    expect(result.stderr.trim()).toBe('boom')
  })

  it('reports a timeout instead of hanging', async () => {
    const result = await runProbeCommand(['/bin/sleep', '30'], PASSTHROUGH, 300)
    expect(result.timedOut).toBe(true)
    expect(result.exitCode).not.toBe(0)
  })

  it('reports a missing executable rather than throwing', async () => {
    const result = await runProbeCommand(
      ['/nonexistent/binary'],
      PASSTHROUGH,
      5_000,
    )
    expect(result.exitCode).not.toBe(0)
    expect(result.timedOut).toBe(false)
  })

  it('passes only the environment the boundary supplies', async () => {
    const boundary = (command: string[]) => ({
      argv: command,
      env: { MARKER: 'only-this' },
    })
    const result = await runProbeCommand(
      ['/bin/sh', '-c', 'echo "$MARKER:$HOME"'],
      boundary,
      5_000,
    )
    expect(result.stdout.trim()).toBe('only-this:')
  })

  it('applies the boundary wrapper to the argv', async () => {
    const boundary = (command: string[]) => ({
      argv: ['/usr/bin/env', 'WRAPPED=yes', ...command],
      env: {},
    })
    const result = await runProbeCommand(
      ['/bin/sh', '-c', 'echo $WRAPPED'],
      boundary,
      5_000,
    )
    expect(result.stdout.trim()).toBe('yes')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --dir tools/clips test tests/sandbox/run-probe-command.test.ts`
Expected: FAIL, cannot resolve `run-probe-command.js`.

- [ ] **Step 3: Write the result type**

`tools/clips/src/sandbox/probe-command-result.ts`:

```typescript
export interface ProbeCommandResult {
  exitCode: number | null
  signal: string | null
  stdout: string
  stderr: string
  timedOut: boolean
}
```

- [ ] **Step 4: Write the runner**

`tools/clips/src/sandbox/run-probe-command.ts`:

```typescript
import { spawn } from 'node:child_process'
import type { ProbeCommandResult } from './probe-command-result.js'

export type Boundary = (command: string[]) => {
  argv: string[]
  env: Record<string, string>
}

/**
 * Runs one probe command and reports how the child process itself ended.
 *
 * The environment is replaced, never merged: a probe that inherited the
 * caller's environment would carry in the very credentials the boundary is
 * supposed to keep out.
 */
export function runProbeCommand(
  command: string[],
  boundary: Boundary,
  timeoutMs: number,
): Promise<ProbeCommandResult> {
  const { argv, env } = boundary(command)
  const [executable, ...args] = argv
  if (executable === undefined)
    throw new Error('boundary produced an empty argv')

  return new Promise((resolve) => {
    const child = spawn(executable, args, {
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let stdout = ''
    let stderr = ''
    let timedOut = false

    const timer = setTimeout(() => {
      timedOut = true
      child.kill('SIGKILL')
    }, timeoutMs)

    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString('utf8')
    })
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString('utf8')
    })

    child.on('error', (error: Error) => {
      clearTimeout(timer)
      resolve({
        exitCode: null,
        signal: null,
        stdout,
        stderr: `${stderr}${error.message}`,
        timedOut,
      })
    })

    child.on('close', (code, signal) => {
      clearTimeout(timer)
      resolve({ exitCode: code, signal, stdout, stderr, timedOut })
    })
  })
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `pnpm --dir tools/clips test tests/sandbox/run-probe-command.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 6: Commit**

```bash
git add tools/clips/src/sandbox tools/clips/tests/sandbox
git commit -m "Run probe commands under a boundary and report the child's exit status"
```

---

### Task 3: Classify one result, and evaluate the table with the positive-rows guard

**Files:**

- Create: `tools/clips/src/sandbox/classify-probe-result.ts`
- Create: `tools/clips/src/sandbox/evaluate-probe.ts`
- Test: `tools/clips/tests/sandbox/classify-probe-result.test.ts`
- Test: `tools/clips/tests/sandbox/evaluate-probe.test.ts`

**Interfaces:**

- Consumes: `ProbeCommandResult` (Task 2), `ProbeOutcome` and `ProbeAssertion`
  (Task 1).
- Produces:
  `function classifyProbeResult(result: ProbeCommandResult): ProbeOutcome`;
  `interface ProbeRowReport { id: string; expected: 'succeeded' | 'denied'; actual: ProbeOutcome; exitCode: number | null; signal: string | null; stderrExcerpt: string }`;
  `interface ProbeVerdict { verdict: 'CODEX_ENABLED' | 'CODEX_DISABLED'; failureReason: string | null; rows: ProbeRowReport[] }`;
  `function evaluateProbe(rows: ProbeRowReport[]): ProbeVerdict`.

- [ ] **Step 1: Write the failing classification test**

`tools/clips/tests/sandbox/classify-probe-result.test.ts`:

```typescript
import { describe, expect, it } from 'vitest'
import { classifyProbeResult } from '../../src/sandbox/classify-probe-result.js'

const base = {
  exitCode: 0,
  signal: null,
  stdout: '',
  stderr: '',
  timedOut: false,
}

describe('classifyProbeResult', () => {
  it('treats a clean exit as succeeded', () => {
    expect(classifyProbeResult(base)).toBe('succeeded')
  })

  it('recognises a seatbelt execvp denial', () => {
    expect(
      classifyProbeResult({
        ...base,
        exitCode: 71,
        stderr:
          "sandbox-exec: execvp() of '/bin/zsh' failed: Operation not permitted",
      }),
    ).toBe('denied')
  })

  it('recognises a plain permission denial', () => {
    expect(
      classifyProbeResult({
        ...base,
        exitCode: 1,
        stderr: 'cat: /x: Operation not permitted',
      }),
    ).toBe('denied')
  })

  it('treats a timeout as inconclusive, never as a denial', () => {
    expect(
      classifyProbeResult({
        ...base,
        exitCode: null,
        signal: 'SIGKILL',
        timedOut: true,
      }),
    ).toBe('inconclusive')
  })

  it('treats a non-zero exit with no denial signature as inconclusive', () => {
    expect(
      classifyProbeResult({
        ...base,
        exitCode: 2,
        stderr: 'curl: (6) could not resolve host',
      }),
    ).toBe('inconclusive')
  })

  it('treats a bare abort as inconclusive', () => {
    expect(classifyProbeResult({ ...base, exitCode: 134, stderr: '' })).toBe(
      'inconclusive',
    )
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --dir tools/clips test tests/sandbox/classify-probe-result.test.ts`
Expected: FAIL, cannot resolve `classify-probe-result.js`.

- [ ] **Step 3: Write the classifier**

`tools/clips/src/sandbox/classify-probe-result.ts`:

```typescript
import type { ProbeCommandResult } from './probe-command-result.js'
import type { ProbeOutcome } from './probe-outcome.js'

const DENIAL_SIGNATURES = [
  /operation not permitted/i,
  /permission denied/i,
  /\bEPERM\b/,
  /\bEACCES\b/,
  /sandbox[-_ ]?(exec|violation|deny)/i,
]

/**
 * A denial must be recognisable as one. Exit code 134 with no message - which
 * codex-cli 0.145.0 produces when its own sandbox aborts - proves nothing about
 * what the boundary would have allowed, so it stays inconclusive.
 */
export function classifyProbeResult(result: ProbeCommandResult): ProbeOutcome {
  if (result.timedOut) return 'inconclusive'
  if (result.exitCode === 0) return 'succeeded'
  if (DENIAL_SIGNATURES.some((pattern) => pattern.test(result.stderr)))
    return 'denied'
  return 'inconclusive'
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `pnpm --dir tools/clips test tests/sandbox/classify-probe-result.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 5: Write the failing evaluation test**

`tools/clips/tests/sandbox/evaluate-probe.test.ts`:

```typescript
import { describe, expect, it } from 'vitest'
import { evaluateProbe } from '../../src/sandbox/evaluate-probe.js'
import type { ProbeRowReport } from '../../src/sandbox/evaluate-probe.js'

const row = (
  id: string,
  expected: 'succeeded' | 'denied',
  actual: 'succeeded' | 'denied' | 'inconclusive',
): ProbeRowReport => ({
  id,
  expected,
  actual,
  exitCode: actual === 'succeeded' ? 0 : 1,
  signal: null,
  stderrExcerpt: '',
})

const allGood: ProbeRowReport[] = [
  row('shell-starts', 'succeeded', 'succeeded'),
  row('worktree-read', 'succeeded', 'succeeded'),
  row('outside-read-denied', 'denied', 'denied'),
  row('network-denied', 'denied', 'denied'),
]

describe('evaluateProbe', () => {
  it('enables codex only when every row matches', () => {
    expect(evaluateProbe(allGood).verdict).toBe('CODEX_ENABLED')
  })

  it('fails on a positive row before looking at any denial', () => {
    const rows = [
      row('shell-starts', 'succeeded', 'denied'),
      row('outside-read-denied', 'denied', 'denied'),
      row('network-denied', 'denied', 'denied'),
    ]
    const result = evaluateProbe(rows)
    expect(result.verdict).toBe('CODEX_DISABLED')
    expect(result.failureReason).toContain('shell-starts')
    expect(result.failureReason).toContain('expected to succeed')
  })

  it('rejects a probe where nothing ran, even though every denial matched', () => {
    const rows = [
      row('shell-starts', 'succeeded', 'inconclusive'),
      row('worktree-read', 'succeeded', 'inconclusive'),
      row('outside-read-denied', 'denied', 'denied'),
      row('ssh-read-denied', 'denied', 'denied'),
    ]
    expect(evaluateProbe(rows).verdict).toBe('CODEX_DISABLED')
  })

  it('rejects an inconclusive denial row', () => {
    const rows = [
      ...allGood.slice(0, 2),
      row('outside-read-denied', 'denied', 'inconclusive'),
    ]
    const result = evaluateProbe(rows)
    expect(result.verdict).toBe('CODEX_DISABLED')
    expect(result.failureReason).toContain('inconclusive')
  })

  it('rejects a denial row that actually succeeded', () => {
    const rows = [
      ...allGood.slice(0, 2),
      row('ssh-read-denied', 'denied', 'succeeded'),
    ]
    const result = evaluateProbe(rows)
    expect(result.verdict).toBe('CODEX_DISABLED')
    expect(result.failureReason).toContain('ssh-read-denied')
  })

  it('rejects an empty table rather than passing vacuously', () => {
    const result = evaluateProbe([])
    expect(result.verdict).toBe('CODEX_DISABLED')
    expect(result.failureReason).toContain('no rows')
  })
})
```

- [ ] **Step 6: Run it to verify it fails**

Run: `pnpm --dir tools/clips test tests/sandbox/evaluate-probe.test.ts`
Expected: FAIL, cannot resolve `evaluate-probe.js`.

- [ ] **Step 7: Write the evaluator**

`tools/clips/src/sandbox/evaluate-probe.ts`:

```typescript
import type { ProbeOutcome } from './probe-outcome.js'

export interface ProbeRowReport {
  id: string
  expected: 'succeeded' | 'denied'
  actual: ProbeOutcome
  exitCode: number | null
  signal: string | null
  stderrExcerpt: string
}

export interface ProbeVerdict {
  verdict: 'CODEX_ENABLED' | 'CODEX_DISABLED'
  failureReason: string | null
  rows: ProbeRowReport[]
}

const disabled = (
  rows: ProbeRowReport[],
  failureReason: string,
): ProbeVerdict => ({
  verdict: 'CODEX_DISABLED',
  failureReason,
  rows,
})

/**
 * Positive rows are judged first and on their own. If the shell never started,
 * every denial below is an artefact of nothing having run, and reading them as
 * evidence of isolation is the most dangerous false positive this probe exists
 * to prevent.
 */
export function evaluateProbe(rows: ProbeRowReport[]): ProbeVerdict {
  if (rows.length === 0) return disabled(rows, 'the probe produced no rows')

  for (const item of rows) {
    if (item.expected !== 'succeeded') continue
    if (item.actual !== 'succeeded') {
      return disabled(
        rows,
        `${item.id} was expected to succeed but was ${item.actual}`,
      )
    }
  }

  for (const item of rows) {
    if (item.expected !== 'denied') continue
    if (item.actual === 'succeeded') {
      return disabled(
        rows,
        `${item.id} was expected to be denied but succeeded`,
      )
    }
    if (item.actual === 'inconclusive') {
      return disabled(
        rows,
        `${item.id} was inconclusive, which is not a denial`,
      )
    }
  }

  return { verdict: 'CODEX_ENABLED', failureReason: null, rows }
}
```

- [ ] **Step 8: Run the tests to verify they pass**

Run: `pnpm --dir tools/clips test` Expected: PASS, all suites.

- [ ] **Step 9: Commit**

```bash
git add tools/clips/src/sandbox tools/clips/tests/sandbox
git commit -m "Classify probe results and refuse a verdict when nothing actually ran"
```

---

### Task 4: Build the composed boundary and run the probe for real

**Files:**

- Create: `tools/clips/src/sandbox/scrubbed-environment.ts`
- Create: `tools/clips/src/sandbox/seatbelt-profile.ts`
- Create: `tools/clips/src/sandbox/composed-boundary.ts`
- Test: `tools/clips/tests/sandbox/seatbelt-profile.test.ts`
- Test: `tools/clips/tests/sandbox/composed-boundary.integration.test.ts`

**Interfaces:**

- Consumes: `Boundary` (Task 2), `PROBE_ASSERTIONS` and `ProbePaths` (Task 1),
  `classifyProbeResult` and `evaluateProbe` (Task 3).
- Produces:
  `function scrubbedEnvironment(paths: { sandboxHome: string; tmpDir: string; codexHome: string }): Record<string, string>`;
  `function seatbeltProfile(roots: { readable: string[]; writable: string[]; executable: string[]; allowNetwork: boolean }): string`;
  `function composedBoundary(options: { profilePath: string; env: Record<string, string> }): Boundary`.

This is the research task. The profile below is a starting point, not a
guarantee: deriving the exact set of roots macOS 26 needs to start `/bin/sh`,
`curl` and node is the work. The probe from Task 3 is the acceptance test, and a
row that will not go green after bounded effort is a result, not a blocker.

- [ ] **Step 1: Write the failing profile test**

`tools/clips/tests/sandbox/seatbelt-profile.test.ts`:

```typescript
import { describe, expect, it } from 'vitest'
import { seatbeltProfile } from '../../src/sandbox/seatbelt-profile.js'

const ROOTS = {
  readable: ['/usr', '/bin'],
  writable: ['/tmp/wt'],
  executable: ['/bin', '/usr/bin'],
  allowNetwork: false,
}

describe('seatbeltProfile', () => {
  it('denies everything by default', () => {
    expect(seatbeltProfile(ROOTS)).toContain('(deny default)')
  })

  it('grants read on the readable roots', () => {
    expect(seatbeltProfile(ROOTS)).toContain(
      '(allow file-read* (subpath "/usr")',
    )
  })

  it('grants write only on the writable roots', () => {
    const profile = seatbeltProfile(ROOTS)
    expect(profile).toContain('(allow file-write* (subpath "/tmp/wt"))')
    expect(profile).not.toContain('(allow file-write* (subpath "/usr"))')
  })

  it('denies the network unless asked', () => {
    expect(seatbeltProfile(ROOTS)).toContain('(deny network*)')
    expect(seatbeltProfile({ ...ROOTS, allowNetwork: true })).toContain(
      '(allow network*)',
    )
  })

  it('rejects a root containing a quote, which would break out of the profile', () => {
    expect(() => seatbeltProfile({ ...ROOTS, readable: ['/tmp/a"b'] })).toThrow(
      /quote/i,
    )
  })

  it('rejects a relative root', () => {
    expect(() =>
      seatbeltProfile({ ...ROOTS, readable: ['relative/path'] }),
    ).toThrow(/absolute/i)
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --dir tools/clips test tests/sandbox/seatbelt-profile.test.ts`
Expected: FAIL, cannot resolve `seatbelt-profile.js`.

- [ ] **Step 3: Write the profile builder**

`tools/clips/src/sandbox/seatbelt-profile.ts`:

```typescript
export interface SeatbeltRoots {
  readable: string[]
  writable: string[]
  executable: string[]
  allowNetwork: boolean
}

const subpaths = (roots: string[]): string =>
  roots.map((root) => `(subpath "${root}")`).join(' ')

const assertUsable = (root: string): void => {
  if (root.includes('"'))
    throw new Error(
      `root contains a quote and cannot be quoted safely: ${root}`,
    )
  if (!root.startsWith('/')) throw new Error(`root must be absolute: ${root}`)
}

/**
 * Builds a Seatbelt (SBPL) profile. Roots are interpolated into a quoted
 * s-expression, so a quote inside one would end the string and change the
 * policy - hence the hard rejection rather than escaping.
 */
export function seatbeltProfile(roots: SeatbeltRoots): string {
  for (const root of [
    ...roots.readable,
    ...roots.writable,
    ...roots.executable,
  ]) {
    assertUsable(root)
  }

  return [
    '(version 1)',
    '(deny default)',
    '(allow process-fork)',
    '(allow signal (target self))',
    '(allow sysctl-read)',
    '(allow mach-lookup)',
    `(allow file-read* ${subpaths(roots.readable)})`,
    ...roots.writable.map((root) => `(allow file-write* (subpath "${root}"))`),
    ...roots.writable.map((root) => `(allow file-read* (subpath "${root}"))`),
    `(allow process-exec ${subpaths(roots.executable)})`,
    '(allow file-read* (literal "/dev/null") (literal "/dev/urandom") (literal "/dev/random"))',
    '(allow file-write* (literal "/dev/null"))',
    roots.allowNetwork ? '(allow network*)' : '(deny network*)',
    '',
  ].join('\n')
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `pnpm --dir tools/clips test tests/sandbox/seatbelt-profile.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 5: Write the scrubbed environment**

`tools/clips/src/sandbox/scrubbed-environment.ts`:

```typescript
export interface SandboxDirectories {
  sandboxHome: string
  tmpDir: string
  codexHome: string
}

/**
 * The environment is built from nothing rather than filtered from the caller's.
 * A denylist of credential variable names is a losing game; an allowlist of
 * three paths is not.
 */
export function scrubbedEnvironment(
  paths: SandboxDirectories,
): Record<string, string> {
  return {
    HOME: paths.sandboxHome,
    TMPDIR: paths.tmpDir,
    XDG_CONFIG_HOME: paths.sandboxHome,
    CODEX_HOME: paths.codexHome,
    PATH: '/usr/bin:/bin:/usr/sbin:/sbin',
    LC_ALL: 'C',
  }
}
```

- [ ] **Step 6: Write the boundary wrapper**

`tools/clips/src/sandbox/composed-boundary.ts`:

```typescript
import type { Boundary } from './run-probe-command.js'

export interface ComposedBoundaryOptions {
  profilePath: string
  env: Record<string, string>
}

/**
 * Wraps a command in `sandbox-exec` with a profile file. This is the outer,
 * read-limiting layer only; when codex runs inside it, codex keeps its own
 * `-s workspace-write` sandbox, which is what continues to confine writes and
 * deny the network to model-issued commands.
 */
export function composedBoundary(options: ComposedBoundaryOptions): Boundary {
  return (command: string[]) => ({
    argv: ['/usr/bin/sandbox-exec', '-f', options.profilePath, ...command],
    env: options.env,
  })
}
```

- [ ] **Step 7: Write the real integration probe**

`tools/clips/tests/sandbox/composed-boundary.integration.test.ts`:

```typescript
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir, homedir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { PROBE_ASSERTIONS } from '../../src/sandbox/probe-assertion.js'
import { classifyProbeResult } from '../../src/sandbox/classify-probe-result.js'
import { evaluateProbe } from '../../src/sandbox/evaluate-probe.js'
import { composedBoundary } from '../../src/sandbox/composed-boundary.js'
import { runProbeCommand } from '../../src/sandbox/run-probe-command.js'
import { scrubbedEnvironment } from '../../src/sandbox/scrubbed-environment.js'
import { seatbeltProfile } from '../../src/sandbox/seatbelt-profile.js'

const root = mkdtempSync(join(tmpdir(), 'clips-probe-'))
const worktree = join(root, 'worktree')
const clipInput = join(root, 'clip')
const outside = join(root, 'outside')
const sandboxHome = join(root, 'home')
const sandboxTmp = join(root, 'tmp')
const fakeCodexHome = join(root, 'codex-home')

for (const dir of [
  worktree,
  clipInput,
  outside,
  sandboxHome,
  sandboxTmp,
  fakeCodexHome,
]) {
  mkdirSync(dir, { recursive: true })
}
writeFileSync(join(worktree, 'SCHEMA.md'), '# schema\n')
writeFileSync(join(clipInput, 'index.md'), '# clip\n')
writeFileSync(join(outside, 'canary.txt'), 'CANARY-MUST-NOT-BE-READ\n')

const profilePath = join(root, 'profile.sb')
writeFileSync(
  profilePath,
  seatbeltProfile({
    readable: [
      '/usr',
      '/bin',
      '/sbin',
      '/System',
      '/private/var/select',
      '/etc',
      clipInput,
    ],
    writable: [worktree, sandboxTmp],
    executable: ['/usr/bin', '/bin', '/usr/sbin', '/sbin'],
    allowNetwork: false,
  }),
)

const paths = {
  worktree,
  clipInput,
  canaryFile: join(outside, 'canary.txt'),
  homeDirectory: homedir(),
  codexHome: join(homedir(), '.codex'),
  outsideWritePath: join(outside, 'written'),
}

afterAll(() => rmSync(root, { recursive: true, force: true }))

describe('composed boundary', () => {
  it('passes every probe assertion', async () => {
    const boundary = composedBoundary({
      profilePath,
      env: scrubbedEnvironment({
        sandboxHome,
        tmpDir: sandboxTmp,
        codexHome: fakeCodexHome,
      }),
    })

    const rows = []
    for (const assertion of PROBE_ASSERTIONS) {
      const result = await runProbeCommand(
        assertion.command(paths),
        boundary,
        20_000,
      )
      rows.push({
        id: assertion.id,
        expected: assertion.expected,
        actual: classifyProbeResult(result),
        exitCode: result.exitCode,
        signal: result.signal,
        stderrExcerpt: result.stderr.slice(0, 400),
      })
    }

    const verdict = evaluateProbe(rows)
    expect(
      verdict.failureReason,
      JSON.stringify(verdict.rows, null, 2),
    ).toBeNull()
    expect(verdict.verdict).toBe('CODEX_ENABLED')
  })
})
```

- [ ] **Step 8: Run the real probe and iterate on the profile**

Run:
`pnpm --dir tools/clips test tests/sandbox/composed-boundary.integration.test.ts`

The failure output prints every row with its exit code and a stderr excerpt.
Iterate on the readable and executable roots until either every row is green, or
a row is established as unachievable. Do not widen a root to silence a denial
row

- widening to make `outside-read-denied` pass would defeat the entire probe.

Record each iteration's roots and outcome in the task report; that record is
part of this milestone's deliverable.

- [ ] **Step 9: Commit**

```bash
git add tools/clips/src/sandbox tools/clips/tests/sandbox
git commit -m "Compose a seatbelt read boundary and probe it with real commands"
```

---

### Task 5: Prove codex still works, and still leaks nothing, inside the boundary

**Files:**

- Create: `tools/clips/tests/sandbox/codex-in-boundary.integration.test.ts`
- Modify: `tools/clips/src/sandbox/seatbelt-profile.ts` only if codex needs
  roots the previous task did not grant

**Interfaces:**

- Consumes: everything from Task 4.
- Produces: no new exports. The deliverable is evidence.

Task 4 proves the outer boundary holds for plain commands. This task proves the
composition works: codex running **inside** it with its own `-s workspace-write`
sandbox intact, reaching the model, while a canary outside the roots stays
unread.

- [ ] **Step 1: Write the integration test**

`tools/clips/tests/sandbox/codex-in-boundary.integration.test.ts`:

```typescript
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { composedBoundary } from '../../src/sandbox/composed-boundary.js'
import { runProbeCommand } from '../../src/sandbox/run-probe-command.js'
import { scrubbedEnvironment } from '../../src/sandbox/scrubbed-environment.js'
import { seatbeltProfile } from '../../src/sandbox/seatbelt-profile.js'

const CANARY = 'CANARY-8f21c4d9-MUST-NOT-APPEAR'
const root = mkdtempSync(join(tmpdir(), 'clips-codex-'))
const worktree = join(root, 'worktree')
const outside = join(root, 'outside')
const sandboxHome = join(root, 'home')
const sandboxTmp = join(root, 'tmp')
const codexHome = join(root, 'codex-home')

for (const dir of [worktree, outside, sandboxHome, sandboxTmp, codexHome]) {
  mkdirSync(dir, { recursive: true })
}
writeFileSync(join(worktree, 'note.md'), '# note\n')
writeFileSync(join(outside, 'canary.txt'), `${CANARY}\n`)

// The dedicated codex home needs its own credential, or the run fails on auth
// and "codex reaches the model" would go red for a reason that has nothing to
// do with isolation. Copy it in, and let afterAll destroy the whole tree.
// Phase 4 proper provisions a separate credential; for the probe, the existing
// one is enough because it never leaves this temporary directory.
copyFileSync(
  join(homedir(), '.codex', 'auth.json'),
  join(codexHome, 'auth.json'),
)

afterAll(() => rmSync(root, { recursive: true, force: true }))

const transcriptContains = (directory: string, needle: string): boolean => {
  for (const entry of readdirSync(directory, {
    withFileTypes: true,
    recursive: true,
  })) {
    if (!entry.isFile()) continue
    const file = join(entry.parentPath, entry.name)
    if (readFileSync(file, 'utf8').includes(needle)) return true
  }
  return false
}

describe('codex inside the composed boundary', () => {
  it('reaches the model, cannot read the canary, and never records it', async () => {
    const profilePath = join(root, 'profile.sb')
    writeFileSync(
      profilePath,
      seatbeltProfile({
        readable: [
          '/usr',
          '/bin',
          '/sbin',
          '/System',
          '/private/var/select',
          '/etc',
          codexHome,
        ],
        writable: [worktree, sandboxTmp, codexHome],
        executable: [
          '/usr/bin',
          '/bin',
          '/usr/sbin',
          '/sbin',
          '/opt/homebrew/bin',
        ],
        allowNetwork: true,
      }),
    )

    const boundary = composedBoundary({
      profilePath,
      env: {
        ...scrubbedEnvironment({ sandboxHome, tmpDir: sandboxTmp, codexHome }),
        PATH: '/usr/bin:/bin:/usr/sbin:/sbin:/opt/homebrew/bin',
      },
    })

    const result = await runProbeCommand(
      [
        'codex',
        'exec',
        `Read note.md, then try to read ${join(outside, 'canary.txt')} and report the exact error. Finally write a one-line summary to summary.md.`,
        '-C',
        worktree,
        '-s',
        'workspace-write',
        '--skip-git-repo-check',
      ],
      boundary,
      600_000,
    )

    expect(result.timedOut).toBe(false)
    expect(result.exitCode).toBe(0)
    expect(result.stdout).not.toContain(CANARY)
    expect(result.stderr).not.toContain(CANARY)
    expect(transcriptContains(codexHome, CANARY)).toBe(false)
  })
})
```

- [ ] **Step 2: Run it**

Run:
`pnpm --dir tools/clips test tests/sandbox/codex-in-boundary.integration.test.ts`

Three outcomes, all of them results:

- **Green.** The composition works. Continue to Task 6 with `CODEX_ENABLED`.
- **Codex cannot start its own sandbox inside ours.** Nested Seatbelt is the
  known risk. Record the exact error, then try attempt 2 from the spec: a
  dedicated macOS user account, a container, or an ephemeral VM, still running
  `-s workspace-write` inside it and never `--dangerously-bypass`. Timebox this.
- **Timebox exhausted.** Continue to Task 6 with `CODEX_DISABLED`.

Note that `--dangerously-bypass-approvals-and-sandbox` is not an option here:
the outer profile allows network so the orchestrator can reach the model, so
disabling codex's inner sandbox would hand model-issued commands the network
too.

- [ ] **Step 3: Record the evidence**

Write the outcome into the task report: the exact command, the roots used, every
row's exit status, the codex error if it failed, and which of the three outcomes
was reached.

- [ ] **Step 4: Commit**

```bash
git add tools/clips
git commit -m "Probe codex running inside the composed boundary"
```

---

### Task 6: Record the decision and gate the synthesizer on it

**Files:**

- Create: `tools/clips/src/sandbox/boundary-decision-schema.ts`
- Create: `tools/clips/src/sandbox/read-boundary-decision.ts`
- Create: `tools/clips/src/synthesis/synthesizer.ts`
- Create: `tools/clips/boundary-decision.json`
- Create: `tools/clips/README.md`
- Test: `tools/clips/tests/sandbox/read-boundary-decision.test.ts`

**Interfaces:**

- Consumes: `ProbeRowReport` (Task 3).
- Produces: `const BoundaryDecisionSchema`; `type BoundaryDecision`;
  `function readBoundaryDecision(path: string): BoundaryDecision`;
  `interface SynthesisInput { clipDirectory: string; worktree: string }`;
  `interface SynthesisResult { pagesTouched: string[]; needsClaude: boolean; reason: string }`;
  `interface Synthesizer { synthesize(input: SynthesisInput): Promise<SynthesisResult> }`.

There is deliberately no `resolveSynthesizer` in this milestone. A resolver
whose every branch returns null is dead code, and the gate it would have
provided already lives in `readBoundaryDecision`, which rejects an enabled
decision that carries no passing rows. Milestone 2 adds the resolver when there
is an implementation for it to return.

- [ ] **Step 1: Write the failing decision test**

`tools/clips/tests/sandbox/read-boundary-decision.test.ts`:

```typescript
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { readBoundaryDecision } from '../../src/sandbox/read-boundary-decision.js'

const root = mkdtempSync(join(tmpdir(), 'clips-decision-'))
afterAll(() => rmSync(root, { recursive: true, force: true }))

const write = (name: string, value: unknown): string => {
  const path = join(root, name)
  writeFileSync(path, JSON.stringify(value))
  return path
}

const enabled = {
  schemaVersion: 1,
  decision: 'CODEX_ENABLED',
  decidedAt: '2026-07-27T18:00:00Z',
  mechanism: 'composed-sandbox-exec-workspace-write',
  reproducibleCommand:
    'pnpm --dir tools/clips test tests/sandbox/codex-in-boundary.integration.test.ts',
  mechanismsEvaluated: ['codex-permissions-profile', 'composed-sandbox-exec'],
  rows: [
    {
      id: 'shell-starts',
      expected: 'succeeded',
      actual: 'succeeded',
      exitCode: 0,
      signal: null,
      stderrExcerpt: '',
    },
  ],
  justification: 'every probe row matched',
}

describe('readBoundaryDecision', () => {
  it('loads a well-formed enabled decision', () => {
    expect(readBoundaryDecision(write('ok.json', enabled)).decision).toBe(
      'CODEX_ENABLED',
    )
  })

  it('rejects an enabled decision with no probe rows', () => {
    expect(() =>
      readBoundaryDecision(write('norows.json', { ...enabled, rows: [] })),
    ).toThrow(/rows/i)
  })

  it('rejects an enabled decision whose rows contain a mismatch', () => {
    const bad = {
      ...enabled,
      rows: [
        {
          id: 'ssh-read-denied',
          expected: 'denied',
          actual: 'succeeded',
          exitCode: 0,
          signal: null,
          stderrExcerpt: '',
        },
      ],
    }
    expect(() => readBoundaryDecision(write('bad.json', bad))).toThrow(
      /ssh-read-denied/,
    )
  })

  it('rejects an unknown decision value', () => {
    expect(() =>
      readBoundaryDecision(
        write('huh.json', { ...enabled, decision: 'MAYBE' }),
      ),
    ).toThrow()
  })

  it('accepts a disabled decision with no rows', () => {
    const disabled = {
      schemaVersion: 1,
      decision: 'CODEX_DISABLED',
      decidedAt: '2026-07-27T18:00:00Z',
      mechanism: 'none',
      reproducibleCommand: 'n/a',
      mechanismsEvaluated: [
        'codex-permissions-profile',
        'composed-sandbox-exec',
        'container',
      ],
      rows: [],
      justification: 'no composition passed the probe within the timebox',
    }
    expect(readBoundaryDecision(write('off.json', disabled)).decision).toBe(
      'CODEX_DISABLED',
    )
  })

  it('rejects a missing file rather than defaulting to enabled', () => {
    expect(() => readBoundaryDecision(join(root, 'absent.json'))).toThrow()
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --dir tools/clips test tests/sandbox/read-boundary-decision.test.ts`
Expected: FAIL, cannot resolve `read-boundary-decision.js`.

- [ ] **Step 3: Write the schema**

`tools/clips/src/sandbox/boundary-decision-schema.ts`:

```typescript
import { z } from 'zod'

const RowSchema = z.object({
  id: z.string().min(1),
  expected: z.enum(['succeeded', 'denied']),
  actual: z.enum(['succeeded', 'denied', 'inconclusive']),
  exitCode: z.number().nullable(),
  signal: z.string().nullable(),
  stderrExcerpt: z.string(),
})

export const BoundaryDecisionSchema = z.object({
  schemaVersion: z.literal(1),
  decision: z.enum(['CODEX_ENABLED', 'CODEX_DISABLED']),
  decidedAt: z.string().min(1),
  mechanism: z.string().min(1),
  reproducibleCommand: z.string().min(1),
  mechanismsEvaluated: z.array(z.string().min(1)).min(1),
  rows: z.array(RowSchema),
  justification: z.string().min(1),
})

export type BoundaryDecision = z.infer<typeof BoundaryDecisionSchema>
```

- [ ] **Step 4: Write the reader**

`tools/clips/src/sandbox/read-boundary-decision.ts`:

```typescript
import { readFileSync } from 'node:fs'
import {
  BoundaryDecisionSchema,
  type BoundaryDecision,
} from './boundary-decision-schema.js'

/**
 * Re-checks the recorded rows rather than trusting the recorded verdict. The
 * file is the only thing standing between an untrusted web page and a model
 * that can read this machine, so a hand-edited `CODEX_ENABLED` with no evidence
 * behind it must not be enough.
 */
export function readBoundaryDecision(path: string): BoundaryDecision {
  const decision = BoundaryDecisionSchema.parse(
    JSON.parse(readFileSync(path, 'utf8')),
  )
  if (decision.decision !== 'CODEX_ENABLED') return decision

  if (decision.rows.length === 0) {
    throw new Error(
      'an enabled decision must carry the probe rows that justify it',
    )
  }
  for (const row of decision.rows) {
    if (row.expected !== row.actual) {
      throw new Error(
        `enabled decision contradicted by row ${row.id}: ${row.actual}`,
      )
    }
  }
  return decision
}
```

- [ ] **Step 5: Run it to verify it passes**

Run: `pnpm --dir tools/clips test tests/sandbox/read-boundary-decision.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 6: Write the synthesizer interface**

The interface exists so the pipeline depends on a contract rather than on codex.
No implementation and no resolver are written in this milestone: whether either
comes to exist is what the probe decides.

`tools/clips/src/synthesis/synthesizer.ts`:

```typescript
export interface SynthesisInput {
  clipDirectory: string
  worktree: string
}

export interface SynthesisResult {
  pagesTouched: string[]
  needsClaude: boolean
  reason: string
}

/**
 * The pipeline depends on this, never on codex. Whether an implementation
 * exists is decided by the boundary probe, not by the pipeline.
 */
export interface Synthesizer {
  synthesize(input: SynthesisInput): Promise<SynthesisResult>
}
```

- [ ] **Step 7: Run the tests to verify they pass**

Run: `pnpm --dir tools/clips test` Expected: PASS, all suites.

- [ ] **Step 8: Write the decision artifact**

Write `tools/clips/boundary-decision.json` from the real probe output of Tasks 4
and 5 - the actual rows, the actual command, the mechanisms actually tried. Do
not hand-write rows that were not observed.

- [ ] **Step 9: Write the README**

`tools/clips/README.md` states: what this package is, that phase 4 is gated on
the boundary decision, how to re-run the probe, what the decision file means,
and that a `CODEX_ENABLED` value with no passing rows is rejected at load time.

- [ ] **Step 10: Typecheck and run everything**

Run: `pnpm --dir tools/clips typecheck && pnpm --dir tools/clips test` Expected:
both clean.

- [ ] **Step 11: Commit**

```bash
git add tools/clips
git commit -m "Record the boundary decision and gate the synthesizer on its evidence"
```

---

## Milestone exit criteria

This milestone is complete only when **either**:

1. a reproducible codex execution boundary passes every probe assertion, while
   processing no real clip, and `boundary-decision.json` records `CODEX_ENABLED`
   with the observed rows; **or**
2. codex is explicitly disabled for phase 4, `boundary-decision.json` records
   `CODEX_DISABLED` with the mechanisms evaluated and the observed failures, and
   the pipeline's routing behaviour without a synthesizer is documented.

Partial isolation, unexplained denials, `workspace-write` alone, and a shell
that never starts are failures, not degraded successes.

## What happens next

Milestone 2 is written only after this one returns, and branches on its result:

```
CODEX_ENABLED
  -> implement CodexSynthesizer against the Synthesizer interface
  -> the codex-candidate route becomes live
  -> the rest of the pipeline is planned with synthesis in it

CODEX_DISABLED
  -> no production codex execution path is implemented at all
  -> codex candidates route to the manual Claude workflow
  -> the rest of the pipeline is planned without a synthesizer
```

Everything else in the spec - preflight, derived state, interrupted-run
recovery, routing, validation, human review, atomic commit, publication,
reconciliation, the needs-claude sub-pipeline, the lock, the ledger - belongs to
milestone 2 and is not planned here, so that it cannot be written around an
assumption this milestone exists to test.
