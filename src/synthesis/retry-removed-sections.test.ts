import { describe, expect, it } from 'vitest'
import { retryRemovedSections } from './retry-removed-sections.ts'
import type { SynthesisInput } from './synthesis-input.ts'
import type { SynthesisResult } from './synthesis-result.ts'
import type { Synthesizer } from './synthesizer.ts'

const result = (reason: string, needsClaude = false): SynthesisResult => ({
  pagesTouched: [],
  needsClaude,
  skipped: false,
  reason,
  identity: { model: 'worker:agy/x', promptSha256: 'x', boundary: 'b' },
})

const input: SynthesisInput = {
  clipDirectory: '/clip',
  worktree: '/wt',
  guidance: '',
}

const recording = (
  needsClaude = false,
): Synthesizer & { inputs: SynthesisInput[] } => {
  const synthesizer = {
    inputs: [] as SynthesisInput[],
    synthesize: async (given: SynthesisInput) => {
      synthesizer.inputs.push(given)
      return Promise.resolve(
        result(`run ${String(synthesizer.inputs.length)}`, needsClaude),
      )
    },
  }
  return synthesizer
}

describe('retryRemovedSections', () => {
  it('discards the draft and runs once more, told which section it dropped', async () => {
    const inner = recording()
    const discarded: string[] = []
    const outcome = await retryRemovedSections(
      inner,
      async () => Promise.resolve('topics/a.md: it removes 1 section(s)'),
      async (worktree) => {
        discarded.push(worktree)
        return Promise.resolve()
      },
    ).synthesize(input)

    expect(inner.inputs).toHaveLength(2)
    expect(discarded).toEqual(['/wt'])
    expect(inner.inputs[1]?.guidance).toContain(
      'topics/a.md: it removes 1 section(s)',
    )
    expect(outcome.reason).toBe('run 2')
  })

  it('keeps a draft that kept every section', async () => {
    const inner = recording()
    await retryRemovedSections(
      inner,
      async () => Promise.resolve(null),
      async () => Promise.resolve(),
    ).synthesize(input)
    expect(inner.inputs).toHaveLength(1)
  })

  it('never repeats an escalation', async () => {
    const inner = recording(true)
    await retryRemovedSections(
      inner,
      async () => Promise.resolve('x'),
      async () => Promise.resolve(),
    ).synthesize(input)
    expect(inner.inputs).toHaveLength(1)
  })
})
