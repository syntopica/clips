import { describe, expect, it } from 'vitest'
import { authorAwareReviewer } from './author-aware-reviewer.ts'
import type { Reviewer } from './reviewer.ts'

const answering = (reason: string): Reviewer => ({
  automatic: true,
  review: async () => Promise.resolve({ verdict: 'apply', reason }),
})

const input = (authorModel: string) => ({
  summary: 'a summary',
  authorModel,
  clipId: '01M098Y2MEC0V8XXXXXXXXXXXX',
  fullDiff: async () => Promise.resolve('diff'),
})

describe('authorAwareReviewer', () => {
  it('hands a diff the primary model wrote to the second reviewer', async () => {
    const reviewer = authorAwareReviewer(
      'gemini-3.1-pro-high',
      answering('primary'),
      answering('second'),
    )

    const outcome = await reviewer.review(input('gemini-3.1-pro-high'))

    expect(outcome.reason).toBe('second')
  })

  it('keeps the primary reviewer for a diff another model wrote', async () => {
    const reviewer = authorAwareReviewer(
      'gemini-3.1-pro-high',
      answering('primary'),
      answering('second'),
    )

    const outcome = await reviewer.review(input('claude-opus-5-5-high'))

    expect(outcome.reason).toBe('primary')
  })
})
