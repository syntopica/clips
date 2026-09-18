import { describe, expect, it } from 'vitest'

import type { TriagedArticle } from './triaged-article.ts'
import { triagedTopics } from './triaged-topics.ts'

const article = (topic: string): TriagedArticle => ({
  url: `https://example.test/${topic}`,
  title: topic,
  firstSeen: '2026-09-18',
  bucket: 'review',
  topic,
  reason: 'why',
})

describe('triagedTopics', () => {
  it('lists each produced topic once, alphabetical, other last', () => {
    expect(
      triagedTopics([
        article('seo'),
        article('other'),
        article('ai-agents'),
        article('seo'),
      ]),
    ).toEqual(['ai-agents', 'seo', 'other'])
  })

  it('omits other when nothing fell into it', () => {
    expect(triagedTopics([article('seo')])).toEqual(['seo'])
  })
})
