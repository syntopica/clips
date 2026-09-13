import { describe, expect, it } from 'vitest'
import { normalizeArticleUrl } from './normalize-article-url.ts'

describe('normalizeArticleUrl', () => {
  it('strips the per-send Medium tracking query', () => {
    expect(
      normalizeArticleUrl(
        'https://medium.com/@joe.njenga/claude-code-ultraplan-launched-i-just-tested-it-and-its-better-than-it-looks-21a628332e97?source=email-8bf66de01196-1782605205864-digest.reader',
      ),
    ).toBe(
      'https://medium.com/@joe.njenga/claude-code-ultraplan-launched-i-just-tested-it-and-its-better-than-it-looks-21a628332e97',
    )
  })

  it('collapses two sends of the same article to one URL', () => {
    const base =
      'https://medium.com/@joe.njenga/claude-code-ultraplan-launched-i-just-tested-it-and-its-better-than-it-looks-21a628332e97'
    expect(
      normalizeArticleUrl(
        `${base}?source=email-8bf66de01196-1782605205864-digest.reader`,
      ),
    ).toBe(
      normalizeArticleUrl(
        `${base}?source=email-8bf66de01196-1782691605864-digest.reader`,
      ),
    )
  })

  it('lowercases the host but leaves the path case alone', () => {
    expect(
      normalizeArticleUrl('https://Medium.COM/@Joe.Njenga/Post-21a628332e97'),
    ).toBe('https://medium.com/@Joe.Njenga/Post-21a628332e97')
  })

  it('strips the fragment', () => {
    expect(
      normalizeArticleUrl(
        'https://medium.com/@joe.njenga/post-21a628332e97#c0ff',
      ),
    ).toBe('https://medium.com/@joe.njenga/post-21a628332e97')
  })

  it('strips a trailing slash from the path', () => {
    expect(
      normalizeArticleUrl('https://medium.com/@joe.njenga/post-21a628332e97/'),
    ).toBe('https://medium.com/@joe.njenga/post-21a628332e97')
  })

  it('reduces a bare host to origin only', () => {
    expect(normalizeArticleUrl('https://policy.medium.com/')).toBe(
      'https://policy.medium.com',
    )
  })
})

describe('identity-bearing query parameters', () => {
  it('keeps the video id on a YouTube watch url', () => {
    expect(
      normalizeArticleUrl('https://www.youtube.com/watch?v=zmrPY6S1FwY'),
    ).toBe('https://www.youtube.com/watch?v=zmrPY6S1FwY')
  })

  it('keeps two different videos apart', () => {
    expect(normalizeArticleUrl('https://www.youtube.com/watch?v=aaa')).not.toBe(
      normalizeArticleUrl('https://www.youtube.com/watch?v=bbb'),
    )
  })

  it('still drops tracking parameters alongside the identity', () => {
    expect(
      normalizeArticleUrl('https://www.youtube.com/watch?v=abc&t=42&si=xyz'),
    ).toBe('https://www.youtube.com/watch?v=abc')
  })

  it('leaves every other host stripped', () => {
    expect(normalizeArticleUrl('https://example.com/post?source=email-1')).toBe(
      'https://example.com/post',
    )
  })
})
