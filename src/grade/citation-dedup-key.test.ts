import { describe, expect, it } from 'vitest'
import { articleDedupKey } from '../harvest/newsletter/article-dedup-key.ts'
import { citationDedupKey } from './citation-dedup-key.ts'

describe('citationDedupKey', () => {
  it('matches a cited url with a trailing slash to the stored clip', () => {
    expect(citationDedupKey('https://userpilot.com/blog/product-launch/')).toBe(
      articleDedupKey('https://userpilot.com/blog/product-launch'),
    )
  })

  it('matches a cited url carrying a query the store dropped', () => {
    expect(
      citationDedupKey('https://developers.openai.com/guides/x?model=gpt-5.6'),
    ).toBe(articleDedupKey('https://developers.openai.com/guides/x'))
  })

  it('keeps two YouTube videos apart', () => {
    expect(citationDedupKey('https://www.youtube.com/watch?v=aaa')).not.toBe(
      citationDedupKey('https://www.youtube.com/watch?v=bbb'),
    )
  })

  it('keys a source that is not a url verbatim', () => {
    expect(citationDedupKey('/Users/x/p/vault/README.md')).toBe(
      '/Users/x/p/vault/README.md',
    )
  })
})
