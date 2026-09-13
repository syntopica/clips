import { describe, expect, it } from 'vitest'
import { AGY_FINE_MODEL } from '../models/agy-fine-model.ts'
import { INTERACTIVE_IDENTITY } from '../synthesis/interactive-identity.ts'
import { EVERY_GRADE_TIER } from './every-grade-tier.ts'
import { modelsThatWroteBatch } from './models-that-wrote-batch.ts'

describe('modelsThatWroteBatch', () => {
  it('reads the environment when no run reported an author', () => {
    expect(modelsThatWroteBatch(null, 'agy-fine')).toEqual(['agy-fine'])
  })

  it('takes the environment worst case for the unpinned default', () => {
    expect(modelsThatWroteBatch(null, undefined)).toEqual([
      'agy-fine',
      'agy-bulk',
    ])
  })

  it('prefers the reported author over the configured transport', () => {
    // The environment is what was asked for; the author is what ran.
    expect(
      modelsThatWroteBatch(INTERACTIVE_IDENTITY.model, 'agy-fine'),
    ).toEqual([])
  })

  it('narrows to the one tier an unattended author used', () => {
    expect(modelsThatWroteBatch(AGY_FINE_MODEL, undefined)).toEqual([
      'agy-fine',
    ])
  })

  it('refuses every tier for an author it cannot place', () => {
    // Worse than either signal alone, on purpose: an unrecognised model is not
    // evidence of safety, and it must not inherit the environment's answer.
    expect(modelsThatWroteBatch('some-new-model', 'codex')).toEqual(
      EVERY_GRADE_TIER,
    )
  })

  it('still throws on an unreadable CLIPS_SYNTHESIS_RUNNER', () => {
    expect(() => modelsThatWroteBatch(null, 'gemini')).toThrow(
      /Unknown CLIPS_SYNTHESIS_RUNNER/,
    )
  })
})
