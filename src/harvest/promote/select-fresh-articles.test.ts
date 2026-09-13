import { describe, expect, it } from 'vitest'
import { selectFreshArticles } from './select-fresh-articles.ts'
import type { TickedArticle } from './ticked-article.ts'

const article = (url: string, title = 'T'): TickedArticle => ({
  url,
  title,
  topic: 'ai-agents',
})

describe('selectFreshArticles', () => {
  it('keeps articles whose post is not clipped yet', () => {
    const ticked = [article('https://medium.com/@a/fresh-000000000001')]

    expect(selectFreshArticles(ticked, new Set())).toEqual(ticked)
  })

  it('drops an article already in the clip store, so a retry after a partial failure does not duplicate it', () => {
    const ticked = [
      article('https://medium.com/@a/already-000000000002'),
      article('https://medium.com/@a/fresh-000000000001'),
    ]
    const clipped = new Set(['000000000002'])

    expect(selectFreshArticles(ticked, clipped)).toEqual([
      article('https://medium.com/@a/fresh-000000000001'),
    ])
  })

  it('compares normalized URLs, so tracking parameters do not defeat the dedup', () => {
    const ticked = [
      article(
        'https://medium.com/@a/already-000000000002?source=email-123-digest.reader',
      ),
    ]
    const clipped = new Set(['000000000002'])

    expect(selectFreshArticles(ticked, clipped)).toEqual([])
  })

  it('drops a post already clipped under another URL spelling', () => {
    const ticked = [
      article('https://shailesh-sharma.medium.com/spec-driven-8b5231d206b7'),
    ]
    const clipped = new Set(['8b5231d206b7'])

    expect(selectFreshArticles(ticked, clipped)).toEqual([])
  })

  it('drops the second of two handle spellings over one post id within a run', () => {
    const ticked = [
      article('https://medium.com/@nitinsgavane/agent-memory-24391dcc4203'),
      article('https://medium.com/@nitingavhane/agent-memory-24391dcc4203'),
    ]

    expect(selectFreshArticles(ticked, new Set())).toEqual([
      article('https://medium.com/@nitinsgavane/agent-memory-24391dcc4203'),
    ])
  })

  it('drops a within-run duplicate, as when the same article is ticked in two topic files', () => {
    const ticked = [
      article('https://medium.com/@a/twice-000000000003', 'First tick'),
      article('https://medium.com/@a/twice-000000000003/', 'Second tick'),
    ]

    expect(selectFreshArticles(ticked, new Set())).toEqual([
      article('https://medium.com/@a/twice-000000000003', 'First tick'),
    ])
  })
})
