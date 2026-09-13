import { describe, expect, it } from 'vitest'
import { ULID_PATTERN } from '../../clips/ulid-pattern.ts'
import { newClipId } from './new-clip-id.ts'

describe('newClipId', () => {
  it('produces an id the ledger path guard accepts', () => {
    expect(newClipId(new Date('2026-07-29T12:00:00Z'))).toMatch(ULID_PATTERN)
  })

  it('sorts by capture time, which is the reason for the timestamp prefix', () => {
    const earlier = newClipId(new Date('2026-07-29T12:00:00Z')).slice(0, 10)
    const later = newClipId(new Date('2026-07-29T12:00:01Z')).slice(0, 10)

    expect(earlier < later).toBe(true)
  })

  it('does not repeat itself within the same millisecond', () => {
    const now = new Date('2026-07-29T12:00:00Z')
    const ids = new Set(Array.from({ length: 200 }, () => newClipId(now)))

    expect(ids.size).toBe(200)
  })
})
