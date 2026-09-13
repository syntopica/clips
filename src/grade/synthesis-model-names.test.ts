import { describe, expect, it } from 'vitest'
import { synthesisModelNames } from './synthesis-model-names.ts'

describe('synthesisModelNames', () => {
  it('returns both agy models for the default transport, which switches mid-batch', () => {
    // The operator grading afterwards cannot tell which model wrote which page,
    // so both count as the author.
    expect(synthesisModelNames(undefined)).toEqual(['agy-fine', 'agy-bulk'])
  })

  it('treats the transport aliases as the same switching pair', () => {
    expect(synthesisModelNames('fallback')).toEqual(['agy-fine', 'agy-bulk'])
    expect(synthesisModelNames('agy')).toEqual(['agy-fine', 'agy-bulk'])
  })

  it('returns the single model a pinned transport uses', () => {
    expect(synthesisModelNames('agy-fine')).toEqual(['agy-fine'])
    expect(synthesisModelNames('agy-bulk')).toEqual(['agy-bulk'])
    expect(synthesisModelNames('codex')).toEqual(['codex'])
  })

  it('throws on an unrecognised name rather than assuming a set', () => {
    // Guessing narrow would let the author grade itself; guessing wide would
    // refuse a grader that was always safe.
    expect(() => synthesisModelNames('gemini')).toThrow(
      /Unknown CLIPS_SYNTHESIS_RUNNER "gemini"/,
    )
  })
})
