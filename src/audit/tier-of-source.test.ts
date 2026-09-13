import { describe, expect, it } from 'vitest'
import { tierOfSource } from './tier-of-source.ts'

describe('tierOfSource', () => {
  it('ranks a repository path as primary, resolvable or not', () => {
    expect(tierOfSource('sources/x/thread-1.md')).toBe('primary')
    expect(tierOfSource('/Users/someone/p/osseus')).toBe('primary')
    // A primary source that moved is still a primary source. Whether the file
    // is there is the grader's question, not the ranking's.
    expect(tierOfSource('sources/vault/gone.pdf')).toBe('primary')
  })

  it('ranks an ordinary url as web', () => {
    expect(tierOfSource('https://medium.com/@a/b-123')).toBe('web')
    expect(tierOfSource('http://example.org/docs')).toBe('web')
  })

  it('ranks the social hosts below web, subdomains included', () => {
    expect(tierOfSource('https://x.com/someone/status/1')).toBe('social')
    expect(tierOfSource('https://mobile.twitter.com/someone')).toBe('social')
    expect(tierOfSource('https://www.reddit.com/r/a')).toBe('social')
    expect(tierOfSource('https://news.ycombinator.com/item?id=1')).toBe(
      'social',
    )
  })

  it('does not read a host that merely ends in a social name as social', () => {
    // Without the dot in the suffix test this is `x.com` and a large share of
    // the web ranks as social.
    expect(tierOfSource('https://notx.com/a')).toBe('web')
    expect(tierOfSource('https://myreddit.com/a')).toBe('web')
  })

  it('ranks a malformed url as web rather than failing the audit', () => {
    // Frontmatter written by a model from untrusted material. Middle rank
    // changes the fewest outcomes.
    expect(tierOfSource('https://')).toBe('web')
  })
})
