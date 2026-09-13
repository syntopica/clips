import { describe, expect, it } from 'vitest'
import { hasMediumPostId } from './has-medium-post-id.ts'

describe('hasMediumPostId', () => {
  it('accepts an article URL ending in a hyphen and 12 hex characters', () => {
    expect(
      hasMediumPostId(
        'https://medium.com/@joe.njenga/claude-code-ultraplan-launched-i-just-tested-it-and-its-better-than-it-looks-21a628332e97',
      ),
    ).toBe(true)
  })

  it('accepts a publication article', () => {
    expect(
      hasMediumPostId('https://medium.com/data-science/a-post-959d1a85284e'),
    ).toBe(true)
  })

  it.each([
    'https://medium.com/@joe.njenga',
    'https://medium.com/tag/artificial-intelligence',
    'https://medium.com/m/signin',
    'https://dev.to/someone/a-post-without-an-id',
  ])('rejects the navigation URL %s', (url) => {
    expect(hasMediumPostId(url)).toBe(false)
  })

  it('rejects an id that is not exactly 12 characters', () => {
    expect(hasMediumPostId('https://medium.com/@a/post-21a628332e9')).toBe(
      false,
    )
    expect(hasMediumPostId('https://medium.com/@a/post-21a628332e971')).toBe(
      false,
    )
  })

  it('rejects an uppercase id, since Medium always emits lowercase hex', () => {
    expect(hasMediumPostId('https://medium.com/@a/post-21A628332E97')).toBe(
      false,
    )
  })

  it('rejects a 12-character suffix that is not hex', () => {
    expect(hasMediumPostId('https://medium.com/@a/post-notahexidxyz')).toBe(
      false,
    )
  })
})
