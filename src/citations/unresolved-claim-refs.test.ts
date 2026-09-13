import { describe, expect, it } from 'vitest'
import { unresolvedClaimRefs } from './unresolved-claim-refs.ts'

const twoSources = ['https://a.example/', 'https://b.example/']

describe('unresolvedClaimRefs', () => {
  it('reports a ref past the end of the source list', () => {
    expect(unresolvedClaimRefs(['S1', 'S3'], twoSources)).toEqual(['S3'])
  })

  it('resolves OWN on a page with no sources at all', () => {
    expect(unresolvedClaimRefs(['OWN'], [])).toEqual([])
  })

  it('never counts OWN against the source list', () => {
    expect(unresolvedClaimRefs(['OWN', 'S2'], twoSources)).toEqual([])
  })

  it('reports S0, which no positional list can ever offer', () => {
    expect(unresolvedClaimRefs(['S0'], twoSources)).toEqual(['S0'])
  })

  it('reports nothing on a page carrying no markers', () => {
    expect(unresolvedClaimRefs([], twoSources)).toEqual([])
  })
})
