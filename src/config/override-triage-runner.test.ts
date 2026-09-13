import { describe, expect, it } from 'vitest'

import { overrideTriageRunner } from './override-triage-runner.ts'

describe('overrideTriageRunner', () => {
  it('preserves input and siblings while overriding only the named setting', () => {
    const document = { runners: { triage: null, preserved: true } }
    expect(
      overrideTriageRunner(document, { CLIPS_TRIAGE_RUNNER: 'agy-bulk' }),
    ).toEqual({ runners: { triage: 'agy-bulk', preserved: true } })
    expect(document.runners.triage).toBeNull()
  })
  it('leaves an absent override alone and preserves explicit empty strings for validation', () => {
    const document = { runners: { triage: null } }
    expect(overrideTriageRunner(document, {})).toBe(document)
    expect(overrideTriageRunner(document, { CLIPS_TRIAGE_RUNNER: '' })).toEqual(
      { runners: { triage: '' } },
    )
  })
})
