import { describe, expect, it } from 'vitest'
import type { SynthesisResult } from '../synthesis/synthesis-result.ts'
import { clipRunOf } from './clip-run-of.ts'

const result = (overrides: Partial<SynthesisResult>): SynthesisResult => ({
  pagesTouched: [],
  needsClaude: false,
  skipped: false,
  reason: 'r',
  identity: { model: 'agy:m', promptSha256: 'p', boundary: 'agy' },
  ...overrides,
})

describe('clipRunOf', () => {
  const started = new Date('2026-10-04T10:00:00.000Z')
  const finished = new Date('2026-10-04T10:01:30.000Z')

  it('times the run and keeps the transport and its usage', () => {
    const usage = {
      inputTokens: 10,
      outputTokens: 2,
      cachedInputTokens: null,
      reasoningTokens: 1,
    }
    expect(clipRunOf(result({ usage }), started, finished)).toEqual({
      startedAt: '2026-10-04T10:00:00.000Z',
      durationMs: 90_000,
      outcome: 'synthesized',
      model: 'agy:m',
      boundary: 'agy',
      workerJobIds: [],
      usage,
    })
  })

  it('names an escalation and a skip, and the worker jobs asked', () => {
    expect(
      clipRunOf(
        result({ needsClaude: true, workerJobIds: ['j-1'] }),
        started,
        finished,
      ),
    ).toMatchObject({
      outcome: 'escalated',
      workerJobIds: ['j-1'],
      usage: null,
    })
    expect(
      clipRunOf(result({ skipped: true }), started, finished).outcome,
    ).toBe('skipped')
  })
})
