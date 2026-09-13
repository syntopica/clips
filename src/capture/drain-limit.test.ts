import { describe, expect, it } from 'vitest'
import { drainLimit } from './drain-limit.ts'

describe('drainLimit', () => {
  it('defaults to the service page ceiling', () => {
    expect(drainLimit(null)).toBe(200)
  })

  it('reads a positive integer', () => {
    expect(drainLimit('5')).toBe(5)
  })

  // A silent fallback here drains the whole inbox when the operator asked for
  // three, which is the one mistake this command cannot take back.
  it.each(['0', '-1', '2.5', 'five', ''])('refuses %s', (flag) => {
    expect(() => drainLimit(flag)).toThrow(/--limit must be a positive integer/)
  })
})
