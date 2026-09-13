import { describe, expect, it } from 'vitest'
import { articleDedupKey } from './article-dedup-key.ts'

/** Both pairs are real, found on 2026-08-02 while resolving the 17 recovered
 * articles: each was promoted twice because the key was the whole URL. */
const AUTHOR_PATH =
  'https://medium.com/@shailesh-sharma/spec-driven-development-8b5231d206b7'
const AUTHOR_SUBDOMAIN =
  'https://shailesh-sharma.medium.com/spec-driven-development-8b5231d206b7'
const HANDLE_ONE = 'https://medium.com/@nitinsgavane/agent-memory-24391dcc4203'
const HANDLE_TWO = 'https://medium.com/@nitingavhane/agent-memory-24391dcc4203'

describe('articleDedupKey', () => {
  it('gives the /@author and author-subdomain forms one key', () => {
    expect(articleDedupKey(AUTHOR_PATH)).toBe('8b5231d206b7')
    expect(articleDedupKey(AUTHOR_SUBDOMAIN)).toBe('8b5231d206b7')
  })

  it('gives two spellings of one handle over one post id the same key', () => {
    expect(articleDedupKey(HANDLE_ONE)).toBe(articleDedupKey(HANDLE_TWO))
  })

  it('keys a publication URL on the post it hosts, not on its domain', () => {
    expect(
      articleDedupKey('https://towardsdatascience.com/why-rag-959d1a85284e'),
    ).toBe(articleDedupKey('https://medium.com/@a/why-rag-959d1a85284e'))
  })

  it('keeps distinct posts distinct', () => {
    expect(articleDedupKey('https://medium.com/@a/one-000000000001')).not.toBe(
      articleDedupKey('https://medium.com/@a/one-000000000002'),
    )
  })

  it('falls back to the whole URL when there is no post id, as for an extension clip', () => {
    const url = 'https://example.com/blog/post'
    expect(articleDedupKey(url)).toBe(url)
  })
})
