import { describe, expect, it } from 'vitest'
import { mergePromoteFailures } from './merge-promote-failures.ts'
import type { PromoteFailure } from './promote-failure.ts'
import type { TickedArticle } from './ticked-article.ts'

const article = (url: string): TickedArticle => ({
  url,
  title: 'T',
  topic: 'ai-agents',
})

const record = (url: string, attempts: number): PromoteFailure => ({
  url,
  title: 'T',
  topic: 'ai-agents',
  attempts,
  lastError: '403',
  lastAttemptAt: '2026-08-08T10:00:00.000Z',
})

const AT = '2026-08-11T10:00:00.000Z'
const ARTICLE_URL = 'https://medium.com/@a/one'

describe('mergePromoteFailures', () => {
  it('records a first failure with one attempt', () => {
    const failed = article(ARTICLE_URL)

    expect(
      mergePromoteFailures(
        [],
        [failed],
        [{ article: failed, error: '403' }],
        AT,
      ),
    ).toEqual([
      {
        url: failed.url,
        title: 'T',
        topic: 'ai-agents',
        attempts: 1,
        lastError: '403',
        lastAttemptAt: AT,
      },
    ])
  })

  it('raises the count instead of appending a second entry, so attempts measure the article', () => {
    const failed = article(ARTICLE_URL)

    expect(
      mergePromoteFailures(
        [record(failed.url, 3)],
        [failed],
        [{ article: failed, error: '429' }],
        AT,
      ),
    ).toEqual([
      {
        url: failed.url,
        title: 'T',
        topic: 'ai-agents',
        attempts: 4,
        lastError: '429',
        lastAttemptAt: AT,
      },
    ])
  })

  it('drops an article that finally landed', () => {
    const landed = article(ARTICLE_URL)

    expect(
      mergePromoteFailures([record(landed.url, 8)], [landed], [], AT),
    ).toEqual([])
  })

  it('leaves an article this run never attempted untouched, so promoting one topic does not erase another', () => {
    const untouched = record('https://medium.com/@a/other', 2)
    const failed = article(ARTICLE_URL)

    expect(
      mergePromoteFailures(
        [untouched],
        [failed],
        [{ article: failed, error: '403' }],
        AT,
      ),
    ).toEqual([
      untouched,
      {
        url: failed.url,
        title: 'T',
        topic: 'ai-agents',
        attempts: 1,
        lastError: '403',
        lastAttemptAt: AT,
      },
    ])
  })
})
