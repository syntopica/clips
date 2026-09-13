import { spawnSync } from 'node:child_process'
import {
  mkdirSync,
  mkdtempSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { candidateRoots } from './candidate-roots.ts'
import { classifyProbeResult } from './classify-probe-result.ts'
import { composedBoundary } from './composed-boundary.ts'
import { evaluateProbe } from './evaluate-probe.ts'
import { PROBE_ASSERTIONS } from './probe-assertions.ts'
import type { ProbeRowReport } from './probe-row-report.ts'
import { runProbeCommand } from './run-probe-command.ts'
import { scrubbedEnvironment } from './scrubbed-environment.ts'
import { seatbeltProfile } from './seatbelt-profile.ts'

// realpath, not the raw temp path: on macOS `/var` and `/tmp` are symlinks into
// `/private`, and Seatbelt matches the canonical path the kernel sees. A grant
// written as `/var/folders/...` matches nothing and the allowed roots read as
// denied - which looks exactly like isolation working.
const root = realpathSync(mkdtempSync(join(tmpdir(), 'clips-probe-')))
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
  seatbeltProfile(candidateRoots({ worktree, clipInput, sandboxTmp })),
)

const paths = {
  worktree,
  clipInput,
  canaryFile: join(outside, 'canary.txt'),
  homeDirectory: homedir(),
  codexHome: join(homedir(), '.codex'),
  outsideWritePath: join(outside, 'written'),
}

afterAll(() => {
  rmSync(root, { recursive: true, force: true })
})

describe.skipIf(
  process.platform !== 'darwin' ||
    spawnSync('which', ['sandbox-exec'], { encoding: 'utf8' }).status !== 0,
)('composed boundary (requires macOS and sandbox-exec on PATH)', () => {
  it('passes every probe assertion', async () => {
    const boundary = composedBoundary({
      profilePath,
      env: scrubbedEnvironment({
        sandboxHome,
        tmpDir: sandboxTmp,
        codexHome: fakeCodexHome,
      }),
    })

    const rows: ProbeRowReport[] = []
    for (const assertion of PROBE_ASSERTIONS) {
      const result = await runProbeCommand(
        assertion.command(paths),
        boundary,
        20_000,
      )
      rows.push({
        id: assertion.id,
        expected: assertion.expected,
        actual: classifyProbeResult(result, assertion.denialSignature),
        exitCode: result.exitCode,
        signal: result.signal,
        stderrExcerpt: result.stderr.slice(0, 400),
      })
    }

    const verdict = evaluateProbe(rows)
    // The rows ride along so a failure prints which probe broke the boundary.
    expect({
      failureReason: verdict.failureReason,
      rows: verdict.rows,
    }).toEqual({ failureReason: null, rows: verdict.rows })
    expect(verdict.verdict).toBe('BOUNDARY_HOLDS')
  })

  // A denial assertion is only evidence if it stops being satisfied once the
  // thing it guards is opened. `network-denied` once reported `denied` with the
  // network fully open, because curl failed reading an SSL config file and its
  // "Operation not permitted" matched a shared denial list. Nothing in the probe
  // could tell the difference; this is what tells it.
  it('stops reporting the network as denied once the network is allowed', async () => {
    const openProfilePath = join(root, 'profile-network-open.sb')
    writeFileSync(
      openProfilePath,
      seatbeltProfile({
        ...candidateRoots({ worktree, clipInput, sandboxTmp }),
        allowNetwork: true,
      }),
    )

    const assertion = PROBE_ASSERTIONS.find(
      (row) => row.id === 'network-denied',
    )
    if (assertion === undefined)
      throw new Error('network-denied assertion is missing')

    const result = await runProbeCommand(
      assertion.command(paths),
      composedBoundary({
        profilePath: openProfilePath,
        env: scrubbedEnvironment({
          sandboxHome,
          tmpDir: sandboxTmp,
          codexHome: fakeCodexHome,
        }),
      }),
      20_000,
    )

    // stderr rides along so a denial prints what the sandbox said.
    expect({
      classification: classifyProbeResult(result, assertion.denialSignature),
      stderr: result.stderr,
    }).not.toMatchObject({ classification: 'denied' })
  })
})
