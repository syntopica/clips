import { describe, expect, it } from 'vitest'
import { parseCodexUsage } from './parse-codex-usage.ts'

describe('parseCodexUsage', () => {
  it('sums the usage of every completed turn', () => {
    const stdout = [
      '{"type":"thread.started","thread_id":"t"}',
      'a warning line that is not JSON',
      '{"type":"turn.completed","usage":{"input_tokens":100,"cached_input_tokens":40,"output_tokens":7,"reasoning_output_tokens":3}}',
      '{"type":"item.completed","item":{"type":"agent_message"}}',
      '{"type":"turn.completed","usage":{"input_tokens":20,"output_tokens":5}}',
      '',
    ].join('\n')
    expect(parseCodexUsage(stdout)).toEqual({
      inputTokens: 120,
      outputTokens: 12,
      cachedInputTokens: 40,
      reasoningTokens: 3,
    })
  })

  it('reports nothing when no turn completed', () => {
    expect(
      parseCodexUsage('{"type":"turn.failed","error":{"message":"x"}}\n'),
    ).toBeNull()
    expect(parseCodexUsage('')).toBeNull()
    expect(parseCodexUsage('{not json\n')).toBeNull()
  })
})
