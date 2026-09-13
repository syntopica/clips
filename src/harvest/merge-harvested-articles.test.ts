import { describe, expect, it } from 'vitest'
import { mergeHarvestedArticles } from './merge-harvested-articles.ts'
import type { HarvestedArticle } from './newsletter/harvested-article.ts'

const article = (
  overrides: Partial<HarvestedArticle> = {},
): HarvestedArticle => ({
  url: 'https://medium.com/@a/post-000000000001',
  title: 'A Post',
  firstSeen: '2026-07-20',
  sender: 'noreply@medium.com',
  count: 1,
  ...overrides,
})

describe('mergeHarvestedArticles', () => {
  it('collapses the same url seen by both collectors into one article', () => {
    const merged = mergeHarvestedArticles(
      [article({ sender: 'noreply@medium.com' })],
      [article({ sender: 'medium-list' })],
    )

    expect(merged).toHaveLength(1)
    expect(merged[0]?.count).toBe(2)
  })

  it('keeps the fuller title, since digest titles are truncated to the email width', () => {
    const merged = mergeHarvestedArticles(
      [article({ title: 'Every AI agent has a memory problem. Ask it a…' })],
      [
        article({
          title: 'Every AI agent has a memory problem. Ask it about yesterday.',
        }),
      ],
    )

    expect(merged[0]?.title).toBe(
      'Every AI agent has a memory problem. Ask it about yesterday.',
    )
  })

  it('keeps the earliest sighting', () => {
    const merged = mergeHarvestedArticles(
      [article({ firstSeen: '2026-07-20' })],
      [article({ firstSeen: '2026-05-02' })],
    )

    expect(merged[0]?.firstSeen).toBe('2026-05-02')
  })

  it('does not mutate its inputs', () => {
    const first = article({ count: 1 })
    mergeHarvestedArticles([first], [article({ count: 1 })])

    expect(first.count).toBe(1)
  })

  it('orders the result newest first', () => {
    const merged = mergeHarvestedArticles([
      article({
        url: 'https://medium.com/@a/old-000000000001',
        firstSeen: '2026-01-01',
      }),
      article({
        url: 'https://medium.com/@a/new-000000000002',
        firstSeen: '2026-07-28',
      }),
    ])

    expect(merged[0]?.firstSeen).toBe('2026-07-28')
  })
})
