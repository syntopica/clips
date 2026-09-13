import { describe, expect, it } from 'vitest'
import type { Clip } from '../clips/clip.ts'
import { requeueRefusal } from './requeue-refusal.ts'
import { structuredFailure } from './structured-failure.ts'

const NEEDS_CLAUDE = 'needs-claude' as const

const parked = (code: string, message: string): Clip =>
  ({
    kind: 'clip',
    bucket: NEEDS_CLAUDE,
    metadata: { clip_id: '01KYFXABHY680TKQHM1WYG7FJG' },
    state: { failure: structuredFailure('synthesis', code, message, false) },
  }) as unknown as Clip

describe('requeueRefusal', () => {
  it('allows a clip a model gave up on', () => {
    // The 2026-08-02 case: agy's quota died mid-run and the clip was parked as
    // permanently as one parked for sensitivity.
    expect(requeueRefusal(parked('MODEL_ESCALATED', 'agy exited 1'))).toBeNull()
  })

  it('allows a clip whose diff the validator refused', () => {
    expect(
      requeueRefusal(parked('CONTENT_VALIDATION_FAILED', 'orphan page')),
    ).toBeNull()
  })

  it('refuses a clip routed for sensitivity', () => {
    // The routing table is deterministic precisely so nothing downstream can
    // lower it, and a requeue is downstream.
    const refusal = requeueRefusal(
      parked('ROUTED_SENSITIVE', 'bank.example is a sensitive domain'),
    )
    expect(refusal).toContain('ROUTED_SENSITIVE')
  })

  it('refuses a clip a human sent to a human', () => {
    // Requeueing would put it back in front of the synthesizer the reviewer
    // had just overruled.
    expect(
      requeueRefusal(parked('REVIEWER_ESCALATED', 'the reviewer escalated')),
    ).toContain('REVIEWER_ESCALATED')
  })

  it('refuses a clip that is not in needs-claude at all', () => {
    const pending = { ...parked('MODEL_ESCALATED', 'x'), bucket: 'pending' }
    expect(requeueRefusal(pending as unknown as Clip)).toContain('pending')
  })

  it('refuses a failure it cannot read, rather than assuming a retry is safe', () => {
    const legacy = {
      ...parked('MODEL_ESCALATED', 'x'),
      state: { failure: 'parked by hand on 2026-07-30' },
    }
    expect(requeueRefusal(legacy as unknown as Clip)).toContain('by hand')
  })

  it('refuses a clip in needs-claude carrying no failure at all', () => {
    const silent = {
      ...parked('MODEL_ESCALATED', 'x'),
      state: { failure: null },
    }
    expect(requeueRefusal(silent as unknown as Clip)).not.toBeNull()
  })
})
