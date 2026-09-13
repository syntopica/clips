import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { enabledBoundaryDecisionFixture } from './boundary-decision-fixture.ts'
import { readBoundaryDecision } from './read-boundary-decision.ts'
import { writeFixtureFile } from './write-fixture-file.ts'

const root = mkdtempSync(join(tmpdir(), 'clips-decision-'))
afterAll(() => {
  rmSync(root, { recursive: true, force: true })
})

describe('readBoundaryDecision - enabled decision validation', () => {
  it('loads a well-formed enabled decision', () => {
    expect(
      readBoundaryDecision(
        writeFixtureFile(root, 'ok.json', enabledBoundaryDecisionFixture),
      ).decision,
    ).toBe('CODEX_ENABLED')
  })

  it('rejects an enabled decision with no probe rows', () => {
    expect(() =>
      readBoundaryDecision(
        writeFixtureFile(root, 'norows.json', {
          ...enabledBoundaryDecisionFixture,
          rows: [],
        }),
      ),
    ).toThrow(/rows/i)
  })

  it('rejects an enabled decision whose rows contain a mismatch', () => {
    const bad = {
      ...enabledBoundaryDecisionFixture,
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
    expect(() =>
      readBoundaryDecision(writeFixtureFile(root, 'bad.json', bad)),
    ).toThrow(/ssh-read-denied/)
  })

  it('rejects an enabled decision whose row expectation was forged to match a fabricated pass', () => {
    // Every row's expected matches its own actual, so the existing
    // expected-vs-actual check alone would let this through: the row for
    // ssh-read-denied claims 'succeeded' is the expected outcome, which
    // contradicts what PROBE_ASSERTIONS defines for that assertion.
    const forged = {
      ...enabledBoundaryDecisionFixture,
      rows: enabledBoundaryDecisionFixture.rows.map((row) =>
        row.id === 'ssh-read-denied'
          ? { ...row, expected: 'succeeded', actual: 'succeeded' }
          : row,
      ),
    }
    expect(() =>
      readBoundaryDecision(writeFixtureFile(root, 'forged.json', forged)),
    ).toThrow(/ssh-read-denied/)
  })

  it('rejects an enabled decision missing a required probe row', () => {
    const missingRow = {
      ...enabledBoundaryDecisionFixture,
      rows: enabledBoundaryDecisionFixture.rows.filter(
        (row) => row.id !== 'ssh-read-denied',
      ),
    }
    expect(() =>
      readBoundaryDecision(writeFixtureFile(root, 'missing.json', missingRow)),
    ).toThrow(/ssh-read-denied/)
  })

  it('rejects an enabled decision whose mechanism is none', () => {
    expect(() =>
      readBoundaryDecision(
        writeFixtureFile(root, 'nomech.json', {
          ...enabledBoundaryDecisionFixture,
          mechanism: 'none',
        }),
      ),
    ).toThrow(/mechanism/i)
  })

  it('rejects an unknown decision value', () => {
    expect(() =>
      readBoundaryDecision(
        writeFixtureFile(root, 'huh.json', {
          ...enabledBoundaryDecisionFixture,
          decision: 'MAYBE',
        }),
      ),
    ).toThrow()
  })
})
