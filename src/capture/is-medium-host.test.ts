import { describe, expect, it } from 'vitest'
import { isMediumHost } from './is-medium-host.ts'

describe('isMediumHost', () => {
  it.each([
    'https://medium.com/@someone/a-post-0123456789ab',
    'https://nitingavhane.medium.com/glm-5-2-is-free-0123456789ab',
    'https://MEDIUM.COM/@someone/a-post-0123456789ab',
  ])('recognises %s', (url) => {
    expect(isMediumHost(url)).toBe(true)
  })

  // A publication on its own domain is Medium-hosted and carries the same
  // markup, but it has no Medium cookie to send, so it is not this test's job.
  it.each([
    'https://www.anthropic.com/news/reflect-with-claude',
    'https://notmedium.com/post',
    'https://levelup.gitconnected.com/a-post',
  ])('does not claim %s', (url) => {
    expect(isMediumHost(url)).toBe(false)
  })

  it('says no rather than throwing on a value that is not a url', () => {
    expect(isMediumHost('medium.com/@someone')).toBe(false)
  })
})
