import { describe, expect, it } from 'vitest'
import { retryEmptySynthesis } from './retry-empty-synthesis.ts'
import type { SynthesisResult } from './synthesis-result.ts'
import type { Synthesizer } from './synthesizer.ts'

const result = (reason: string): SynthesisResult => ({
  pagesTouched: [],
  needsClaude: false,
  skipped: false,
  reason,
  identity: { model: 'gemini-3.1-pro-high', promptSha256: 'x', boundary: 'b' },
})

const input = { clipDirectory: '/clip', worktree: '/wt', guidance: '' }

const counting = (): Synthesizer & { calls: number } => {
  const synthesizer = {
    calls: 0,
    synthesize: async () => {
      synthesizer.calls += 1
      return Promise.resolve(result(`run ${String(synthesizer.calls)}`))
    },
  }
  return synthesizer
}

describe('retryEmptySynthesis', () => {
  it('runs a synthesis that left the worktree unchanged once more', async () => {
    const inner = counting()
    const outcome = await retryEmptySynthesis(inner, async () =>
      Promise.resolve(true),
    ).synthesize(input)

    expect(inner.calls).toBe(2)
    expect(outcome.reason).toBe('run 2')
  })

  it('keeps a synthesis that wrote pages', async () => {
    const inner = counting()
    await retryEmptySynthesis(inner, async () =>
      Promise.resolve(false),
    ).synthesize(input)

    expect(inner.calls).toBe(1)
  })
})
