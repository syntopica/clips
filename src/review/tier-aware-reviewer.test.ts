import { describe, expect, it } from 'vitest'
import type { Reviewer } from './reviewer.ts'
import { tierAwareReviewer } from './tier-aware-reviewer.ts'

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

describe('tierAwareReviewer', () => {
  const reviewer = tierAwareReviewer(answering('remote'), answering('home'))

  it('sends a diff the local model wrote to the remote reviewer', async () => {
    const outcome = await reviewer.review(input('worker:ollama/qwen3.6:35b'))

    expect(outcome.reason).toBe('remote')
  })

  it('keeps a diff a remote model wrote with the home reviewer', async () => {
    const outcome = await reviewer.review(
      input('worker:openrouter/qwen/qwen3.8-27b:free'),
    )

    expect(outcome.reason).toBe('home')
  })
})
