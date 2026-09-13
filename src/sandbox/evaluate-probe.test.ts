import { describe, expect, it } from 'vitest'
import { evaluateProbe } from './evaluate-probe.ts'
import type { ProbeRowReport } from './probe-row-report.ts'

/** The positive row proving the sandboxed shell ran at all. */
const SHELL_STARTS = 'shell-starts'
/** The denial row for a read outside the worktree. */
const OUTSIDE_READ_DENIED = 'outside-read-denied'
/** The denial row for a read of the ssh directory. */
const SSH_READ_DENIED = 'ssh-read-denied'

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
  row(SHELL_STARTS, 'succeeded', 'succeeded'),
  row('worktree-read', 'succeeded', 'succeeded'),
  row(OUTSIDE_READ_DENIED, 'denied', 'denied'),
  row('network-denied', 'denied', 'denied'),
]

describe('evaluateProbe', () => {
  it('enables codex only when every row matches', () => {
    expect(evaluateProbe(allGood).verdict).toBe('BOUNDARY_HOLDS')
  })

  it('fails on a positive row before looking at any denial', () => {
    const rows = [
      row(SHELL_STARTS, 'succeeded', 'denied'),
      row(OUTSIDE_READ_DENIED, 'denied', 'denied'),
      row('network-denied', 'denied', 'denied'),
    ]
    const result = evaluateProbe(rows)
    expect(result.verdict).toBe('BOUNDARY_FAILED')
    expect(result.failureReason).toContain(SHELL_STARTS)
    expect(result.failureReason).toContain('expected to succeed')
  })

  it('rejects a probe where nothing ran, even though every denial matched', () => {
    const rows = [
      row(SHELL_STARTS, 'succeeded', 'inconclusive'),
      row('worktree-read', 'succeeded', 'inconclusive'),
      row(OUTSIDE_READ_DENIED, 'denied', 'denied'),
      row(SSH_READ_DENIED, 'denied', 'denied'),
    ]
    expect(evaluateProbe(rows).verdict).toBe('BOUNDARY_FAILED')
  })

  it('rejects an inconclusive denial row', () => {
    const rows = [
      ...allGood.slice(0, 2),
      row(OUTSIDE_READ_DENIED, 'denied', 'inconclusive'),
    ]
    const result = evaluateProbe(rows)
    expect(result.verdict).toBe('BOUNDARY_FAILED')
    expect(result.failureReason).toContain('inconclusive')
  })

  it('rejects a denial row that actually succeeded', () => {
    const rows = [
      ...allGood.slice(0, 2),
      row(SSH_READ_DENIED, 'denied', 'succeeded'),
    ]
    const result = evaluateProbe(rows)
    expect(result.verdict).toBe('BOUNDARY_FAILED')
    expect(result.failureReason).toContain(SSH_READ_DENIED)
  })

  it('rejects an empty table rather than passing vacuously', () => {
    const result = evaluateProbe([])
    expect(result.verdict).toBe('BOUNDARY_FAILED')
    expect(result.failureReason).toContain('no rows')
  })

  it('diagnoses the positive row first even when a denial row failed earlier in the table', () => {
    const rows = [
      row(SSH_READ_DENIED, 'denied', 'succeeded'),
      row(SHELL_STARTS, 'succeeded', 'inconclusive'),
    ]
    const result = evaluateProbe(rows)
    expect(result.verdict).toBe('BOUNDARY_FAILED')
    expect(result.failureReason).toContain(SHELL_STARTS)
    expect(result.failureReason).not.toContain(SSH_READ_DENIED)
  })
})
