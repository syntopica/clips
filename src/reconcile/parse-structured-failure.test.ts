import { describe, expect, it } from 'vitest'
import { parseStructuredFailure } from './parse-structured-failure.ts'
import { structuredFailure } from './structured-failure.ts'

describe('parseStructuredFailure', () => {
  it('reads back what structuredFailure wrote', () => {
    const written = structuredFailure(
      'synthesis',
      'MODEL_ESCALATED',
      'agy exited 1',
      false,
    )
    expect(parseStructuredFailure(written)).toMatchObject({
      version: 1,
      stage: 'synthesis',
      code: 'MODEL_ESCALATED',
      message: 'agy exited 1',
      retryable: false,
    })
  })

  it('returns null for a clip that was never escalated', () => {
    expect(parseStructuredFailure(null)).toBeNull()
  })

  it('returns null for the free text the field held before the prefix', () => {
    expect(parseStructuredFailure('codex ran out of credits')).toBeNull()
  })

  it('returns null rather than throwing on damaged JSON', () => {
    expect(parseStructuredFailure('phase4:error:{"stage":')).toBeNull()
  })

  it('returns null when a field is missing, so a caller cannot read a hole', () => {
    expect(
      parseStructuredFailure('phase4:error:{"version":1,"stage":"synthesis"}'),
    ).toBeNull()
  })
})
