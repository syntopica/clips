import { afterEach, describe, expect, it, vi } from 'vitest'
import { synthesizeWithFallback } from './synthesize-with-fallback.ts'

vi.mock('./agy-fine-synthesizer.ts', () => ({
  agyFineSynthesizer: {
    synthesize: async () =>
      Promise.resolve({
        pagesTouched: [],
        needsClaude: true,
        skipped: false,
        reason:
          'agy produced no parseable output (PROMPT_OUTPUT_INVALID): Error: Individual quota reached. Please upgrade your subscription to increase your limits. Resets in 3h1m57s.',
        identity: {
          model: 'fine',
          promptSha256: 'a'.repeat(64),
          boundary: 'agy-accept-edits',
        },
      }),
  },
}))

vi.mock('./agy-bulk-synthesizer.ts', () => ({
  agyBulkSynthesizer: {
    synthesize: async () =>
      Promise.resolve({
        pagesTouched: ['topics/a.md'],
        needsClaude: false,
        skipped: false,
        reason: 'wrote one page',
        identity: {
          model: 'bulk',
          promptSha256: 'b'.repeat(64),
          boundary: 'agy-accept-edits',
        },
      }),
  },
}))

afterEach(() => {
  vi.restoreAllMocks()
})

describe('synthesizeWithFallback', () => {
  it('carries the identity of the model that wrote the page, not the one it started on', async () => {
    vi.spyOn(process.stderr, 'write').mockImplementation(() => true)

    const result = await synthesizeWithFallback.synthesize({
      clipDirectory: '/clips/one',
      worktree: '/wt',
      guidance: '',
    })

    // This is why identity travels with the result rather than with the
    // Synthesizer: the quota wall switches models mid-batch, so which one
    // wrote the page is only known once the run is over.
    expect(result.identity.model).toBe('bulk')
    expect(result.pagesTouched).toEqual(['topics/a.md'])
  })
})
