import { describe, expect, it } from 'vitest'
import { refsForSources } from './refs-for-sources.ts'

describe('refsForSources', () => {
  it('numbers the sources from one, in list order', () => {
    expect(
      refsForSources(['https://a.example/', 'sources/clip.md', 'b.md']),
    ).toEqual(['S1', 'S2', 'S3'])
  })

  it('gives a single source the only ref there is', () => {
    expect(refsForSources(['https://a.example/'])).toEqual(['S1'])
  })

  it('offers nothing for a page with no sources', () => {
    expect(refsForSources([])).toEqual([])
  })
})
