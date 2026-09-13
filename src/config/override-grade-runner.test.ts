import { describe, expect, it } from 'vitest'

import { overrideGradeRunner } from './override-grade-runner.ts'

describe('overrideGradeRunner', () => {
  it('preserves input and siblings while overriding only the named setting', () => {
    const document = { runners: { grade: null, preserved: true } }
    expect(
      overrideGradeRunner(document, { CLIPS_GRADE_RUNNER: 'cursor' }),
    ).toEqual({ runners: { grade: 'cursor', preserved: true } })
    expect(document.runners.grade).toBeNull()
  })
  it('leaves an absent override alone and preserves explicit empty strings for validation', () => {
    const document = { runners: { grade: null } }
    expect(overrideGradeRunner(document, {})).toBe(document)
    expect(overrideGradeRunner(document, { CLIPS_GRADE_RUNNER: '' })).toEqual({
      runners: { grade: '' },
    })
  })
})
