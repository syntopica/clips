import { describe, expect, it } from 'vitest'
import { tierOfClaimRef } from './tier-of-claim-ref.ts'

const sources = [
  'sources/clips/a.md',
  'https://x.com/one/status/2',
  'https://a.example/',
]

describe('tierOfClaimRef', () => {
  it('gives OWN the tier nothing else could return', () => {
    expect(tierOfClaimRef('OWN', [])).toBe('owner')
  })

  it('takes the tier of the source a positional ref points at', () => {
    expect(tierOfClaimRef('S1', sources)).toBe('primary')
    expect(tierOfClaimRef('S2', sources)).toBe('social')
    expect(tierOfClaimRef('S3', sources)).toBe('web')
  })

  it('gives an unresolved ref no tier rather than inventing one', () => {
    expect(tierOfClaimRef('S4', sources)).toBeNull()
  })
})
