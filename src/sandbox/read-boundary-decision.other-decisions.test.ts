import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { readBoundaryDecision } from './read-boundary-decision.ts'
import { writeFixtureFile } from './write-fixture-file.ts'

const root = mkdtempSync(join(tmpdir(), 'clips-decision-'))
afterAll(() => {
  rmSync(root, { recursive: true, force: true })
})

describe('readBoundaryDecision - other decision states', () => {
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
    expect(
      readBoundaryDecision(writeFixtureFile(root, 'off.json', disabled))
        .decision,
    ).toBe('CODEX_DISABLED')
  })

  it('rejects a missing file rather than defaulting to enabled', () => {
    expect(() => readBoundaryDecision(join(root, 'absent.json'))).toThrow()
  })

  // The committed artifact must always survive its own gate. Editing the
  // justification or tightening the gate can break it, and that would only
  // surface the next time someone tried to read the milestone's verdict.
  it('accepts the operator override with no rows', () => {
    const override = {
      schemaVersion: 1,
      decision: 'CODEX_OPERATOR_OVERRIDE',
      decidedAt: '2026-07-28T22:30:00Z',
      mechanism: 'workspace-write-only-operator-accepted-open-reads',
      reproducibleCommand: 'n/a',
      mechanismsEvaluated: ['operator-override'],
      rows: [],
      justification: 'operator explicitly accepted open reads',
    }
    expect(
      readBoundaryDecision(writeFixtureFile(root, 'override.json', override))
        .decision,
    ).toBe('CODEX_OPERATOR_OVERRIDE')
  })

  // Which decision is committed belongs to the instance, not to the engine:
  // the repository ships refusing and an operator replaces the file with their
  // own. What the engine guarantees is that whatever is committed survives the
  // reader, which re-checks an enabled decision's evidence rather than trusting
  // its verdict - so this asserts the file loads, not what it says.
  it('loads the committed boundary-decision.json', () => {
    const committed = new URL('../../boundary-decision.json', import.meta.url)
      .pathname
    expect([
      'CODEX_ENABLED',
      'CODEX_DISABLED',
      'CODEX_OPERATOR_OVERRIDE',
    ]).toContain(readBoundaryDecision(committed).decision)
  })
})
