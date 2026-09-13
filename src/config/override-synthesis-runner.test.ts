import { describe, expect, it } from 'vitest'

import { overrideSynthesisRunner } from './override-synthesis-runner.ts'

describe('overrideSynthesisRunner', () => {
  it('preserves input and siblings while overriding only the named setting', () => {
    const document = { runners: { synthesis: null, preserved: true } }
    expect(
      overrideSynthesisRunner(document, { CLIPS_SYNTHESIS_RUNNER: 'manual' }),
    ).toEqual({ runners: { synthesis: 'manual', preserved: true } })
    expect(document.runners.synthesis).toBeNull()
  })
  it('leaves an absent override alone and preserves explicit empty strings for validation', () => {
    const document = { runners: { synthesis: null } }
    expect(overrideSynthesisRunner(document, {})).toBe(document)
    expect(
      overrideSynthesisRunner(document, { CLIPS_SYNTHESIS_RUNNER: '' }),
    ).toEqual({ runners: { synthesis: '' } })
  })
})
