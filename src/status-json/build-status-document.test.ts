import { describe, expect, it } from 'vitest'
import { buildStatusDocument } from './build-status-document.ts'

const now = new Date('2026-08-30T10:00:00.000Z')

describe('buildStatusDocument', () => {
  it('reports every state, the oldest capture per waiting state, and intake', () => {
    const document = buildStatusDocument(
      [
        { state: 'pending', capturedAt: Date.parse('2026-08-29T08:00:00Z') },
        { state: 'pending', capturedAt: Date.parse('2026-06-01T08:00:00Z') },
        { state: 'reconciled', capturedAt: Date.parse('2026-05-01T08:00:00Z') },
        { state: 'unreadable', capturedAt: null },
      ],
      now,
    )
    expect(document.schemaVersion).toBe(1)
    expect(document.generatedAt).toBe('2026-08-30T10:00:00.000Z')
    expect(document.total).toBe(4)
    expect(document.states).toEqual({
      pending: 2,
      synthesized: 0,
      'locally-stale': 0,
      'reconciliation-pending': 0,
      reconciled: 1,
      'needs-claude': 0,
      inconsistent: 0,
      unreadable: 1,
    })
    expect(document.oldestAt).toEqual({
      pending: '2026-06-01T08:00:00.000Z',
      synthesized: null,
      'locally-stale': null,
      'reconciliation-pending': null,
      'needs-claude': null,
      inconsistent: null,
      unreadable: null,
    })
    expect(document.oldestAt).not.toHaveProperty('reconciled')
    expect(document.intake.undated).toBe(1)
    expect(document.intake.days.at(-2)).toEqual({
      day: '2026-08-29',
      count: 1,
    })
  })
})
