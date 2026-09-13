import { describe, expect, it } from 'vitest'
import { postEntry } from './post-entry.ts'

const article = {
  __typename: 'Post',
  id: '83ef7b5521f7',
  title: 'The Real Article',
  mediumUrl: 'https://medium.com/@a/the-real-article-83ef7b5521f7',
  isLocked: true,
  creator: { __ref: 'User:abc123' },
  'content({"postMeteringOptions":{"referrer":""}})': {
    bodyModel: {
      paragraphs: [{ __ref: 'Paragraph:p1' }, { __ref: 'Paragraph:p2' }],
    },
  },
}

/** A recommended article cached alongside the real one: an id, a URL, no title
 * and no content. Observed on a live page 2026-07-29. */
const neighbour = {
  __typename: 'Post',
  id: 'fbef1f9aa63f',
  firstPublishedAt: 1_780_000_000_000,
  creator: { __ref: 'User:def456' },
  mediumUrl: 'https://medium.com/@b/some-other-post-fbef1f9aa63f',
  uniqueSlug: 'some-other-post-fbef1f9aa63f',
}

describe('postEntry', () => {
  it('picks the post carrying the body, not a recommended neighbour listed first', () => {
    const found = postEntry({
      'Post:fbef1f9aa63f': neighbour,
      'Post:83ef7b5521f7': article,
    })

    expect(found.title).toBe('The Real Article')
    expect(found.paragraphRefs).toEqual(['Paragraph:p1', 'Paragraph:p2'])
  })

  it('reads the same post whichever order the cache lists them in', () => {
    const found = postEntry({
      'Post:83ef7b5521f7': article,
      'Post:fbef1f9aa63f': neighbour,
    })

    expect(found.title).toBe('The Real Article')
  })

  it('carries the creator reference and the lock flag', () => {
    const found = postEntry({ 'Post:83ef7b5521f7': article })

    expect(found.creatorRef).toBe('User:abc123')
    expect(found.isLocked).toBe(true)
  })

  it('says the page is not an article when no post carries a body', () => {
    expect(() => postEntry({ 'Post:fbef1f9aa63f': neighbour })).toThrow(
      /not a Medium article/u,
    )
  })

  it('accepts the unparameterised content field name too', () => {
    const found = postEntry({
      'Post:1': {
        title: 'T',
        mediumUrl: 'https://medium.com/@a/t-000000000001',
        content: { bodyModel: { paragraphs: [] } },
      },
    })

    expect(found.title).toBe('T')
  })
})
