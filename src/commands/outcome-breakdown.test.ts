import { describe, expect, it } from 'vitest'
import { outcomeBreakdown } from './outcome-breakdown.ts'

describe('outcomeBreakdown', () => {
  it('counts each outcome in a fixed order, whatever order they happened in', () => {
    expect(
      outcomeBreakdown(['skipped', 'published', 'reconciled', 'published']),
    ).toBe('2 published, 1 reconciled, 1 skipped')
  })

  it('leaves out the outcomes that did not happen', () => {
    expect(outcomeBreakdown(['quit'])).toBe('1 quit')
  })

  it('is empty when no clip reached the pipeline', () => {
    expect(outcomeBreakdown([])).toBe('')
  })
})
