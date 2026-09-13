import { describe, expect, it } from 'vitest'
import { isAgyQuotaExhausted } from './is-agy-quota-exhausted.ts'

describe('isAgyQuotaExhausted', () => {
  it('matches what agy actually printed', () => {
    expect(
      isAgyQuotaExhausted(
        'Error: Individual quota reached. Please upgrade your subscription to increase your limits. Resets in 3h1m57s.',
      ),
    ).toBe(true)
  })

  it('ignores an article that merely talks about quotas', () => {
    expect(
      isAgyQuotaExhausted('I reached my individual quota in a single week'),
    ).toBe(false)
  })

  it('is false for an empty tail', () => {
    expect(isAgyQuotaExhausted('')).toBe(false)
  })
})
