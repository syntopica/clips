import { describe, expect, it } from 'vitest'
import { parseAgyUsage } from './parse-agy-usage.ts'

describe('parseAgyUsage', () => {
  it('reads the usage block of a json envelope', () => {
    const envelope = JSON.stringify({
      conversation_id: 'c',
      status: 'SUCCESS',
      response: 'OK',
      duration_seconds: 2.6,
      usage: {
        input_tokens: 26728,
        output_tokens: 43,
        thinking_tokens: 42,
        cache_read_tokens: 0,
        total_tokens: 26771,
      },
    })
    expect(parseAgyUsage(envelope)).toEqual({
      inputTokens: 26728,
      outputTokens: 43,
      cachedInputTokens: 0,
      reasoningTokens: 42,
    })
  })

  it('leaves an unreported optional count null', () => {
    expect(
      parseAgyUsage(
        JSON.stringify({ usage: { input_tokens: 1, output_tokens: 2 } }),
      ),
    ).toEqual({
      inputTokens: 1,
      outputTokens: 2,
      cachedInputTokens: null,
      reasoningTokens: null,
    })
  })

  it('reports nothing for an envelope without usable counts', () => {
    expect(parseAgyUsage('not json')).toBeNull()
    expect(parseAgyUsage(JSON.stringify({ status: 'SUCCESS' }))).toBeNull()
    expect(
      parseAgyUsage(JSON.stringify({ usage: { input_tokens: 'many' } })),
    ).toBeNull()
  })
})
