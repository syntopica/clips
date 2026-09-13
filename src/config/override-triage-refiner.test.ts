import { describe, expect, it } from 'vitest'

import { overrideTriageRefiner } from './override-triage-refiner.ts'

describe('overrideTriageRefiner', () => {
  it('preserves input and siblings while overriding only the named setting', () => {
    const document = { runners: { triageRefiner: null, preserved: true } }
    expect(
      overrideTriageRefiner(document, { CLIPS_TRIAGE_REFINER: 'agy-fine' }),
    ).toEqual({ runners: { triageRefiner: 'agy-fine', preserved: true } })
    expect(document.runners.triageRefiner).toBeNull()
  })
  it('leaves an absent override alone and preserves explicit empty strings for validation', () => {
    const document = { runners: { triageRefiner: null } }
    expect(overrideTriageRefiner(document, {})).toBe(document)
    expect(
      overrideTriageRefiner(document, { CLIPS_TRIAGE_REFINER: '' }),
    ).toEqual({ runners: { triageRefiner: '' } })
  })
})
