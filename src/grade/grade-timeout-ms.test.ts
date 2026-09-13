import { describe, expect, it } from 'vitest'
import { EVIDENCE_BYTE_BUDGET } from './evidence-byte-budget.ts'
import { gradeTimeoutMs } from './grade-timeout-ms.ts'

const MINUTES = 60_000
const KB = 1024

describe('gradeTimeoutMs', () => {
  it('gives a small page the ten minutes it always had', () => {
    expect(gradeTimeoutMs(0)).toBe(10 * MINUTES)
    expect(gradeTimeoutMs(40 * KB)).toBe(10 * MINUTES)
    expect(gradeTimeoutMs(512 * KB)).toBe(10 * MINUTES)
  })

  it('scales with the evidence, so the two hubs that were refused now fit', () => {
    // topics/agent-automation, reported over the old budget at 611 KB.
    expect(gradeTimeoutMs(611 * KB)).toBe(20 * MINUTES)
    // topics/agent-harnesses, at 1068 KB across 47 sources.
    expect(gradeTimeoutMs(1068 * KB)).toBe(30 * MINUTES)
  })

  it('stops at forty minutes, and the byte budget says the same thing', () => {
    expect(gradeTimeoutMs(EVIDENCE_BYTE_BUDGET)).toBe(40 * MINUTES)
    expect(gradeTimeoutMs(50 * 1024 * KB)).toBe(40 * MINUTES)
  })
})
