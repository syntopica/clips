import type { Reviewer } from '../review/reviewer.ts'

export const verdictReviewer = (
  verdict: 'apply' | 'skip' | 'claude',
): Reviewer => ({
  automatic: false,
  review: async () =>
    Promise.resolve({
      verdict,
      reason: verdict === 'skip' ? 'scripted rejection' : '',
    }),
})
