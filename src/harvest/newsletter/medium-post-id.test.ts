import { describe, expect, it } from 'vitest'
import { mediumPostId } from './medium-post-id.ts'

describe('mediumPostId', () => {
  it('reads the id off the end of an article URL', () => {
    expect(mediumPostId('https://medium.com/@a/spec-driven-8b5231d206b7')).toBe(
      '8b5231d206b7',
    )
  })

  it('is null for a URL that carries no post id', () => {
    expect(mediumPostId('https://medium.com/@a')).toBeNull()
  })

  it('is null for a longer hex run, so a checksum is not read as an id', () => {
    expect(mediumPostId('https://example.com/x-0123456789abcdef')).toBeNull()
  })
})
