import { describe, expect, it } from 'vitest'
import { sha256Hex } from '../harvest/promote/sha256-hex.ts'
import { codexPrompt } from './codex-prompt.ts'
import type { CodexRunner } from './codex-runner.ts'
import { codexSynthesizer } from './codex-synthesizer.ts'

const input = { clipDirectory: '/clips/one', worktree: '/wt', guidance: '' }

const runner = (
  exitCode: number,
  lastMessage: string | null,
  stderrTail = '',
): CodexRunner => ({
  run: async () => Promise.resolve({ exitCode, lastMessage, stderrTail }),
})

describe('codexSynthesizer', () => {
  it('maps a valid final message onto the synthesis result', async () => {
    const result = await codexSynthesizer(
      runner(
        0,
        JSON.stringify({
          pages_touched: ['topics/a.md'],
          needs_claude: false,
          reason: 'wrote one page',
        }),
      ),
    ).synthesize(input)
    expect(result).toEqual({
      pagesTouched: ['topics/a.md'],
      needsClaude: false,
      skipped: false,
      reason: 'wrote one page',
      identity: {
        model: 'codex',
        promptSha256: sha256Hex(codexPrompt('/clips/one/index.md', '')),
        boundary: 'codex-danger-full-access',
      },
    })
  })

  it('reports its identity even when the run failed', async () => {
    const result = await codexSynthesizer(
      runner(1, null, 'out of credits'),
    ).synthesize(input)

    // The ledger only records a published page, but a routed clip's evidence
    // is worth as much when it names the transport that could not write it.
    expect(result.identity.model).toBe('codex')
    expect(result.identity.promptSha256).toHaveLength(64)
  })

  it('escalates a non-zero exit with the stderr evidence', async () => {
    const result = await codexSynthesizer(
      runner(1, null, 'stream error: quota exhausted'),
    ).synthesize(input)
    expect(result.needsClaude).toBe(true)
    expect(result.reason).toContain('quota exhausted')
  })

  it('escalates a missing or malformed final message', async () => {
    for (const message of [null, 'not json', '{"needs_claude": true}']) {
      const result = await codexSynthesizer(runner(0, message)).synthesize(
        input,
      )
      expect(result.needsClaude).toBe(true)
      expect(result.reason).toContain('PROMPT_OUTPUT_INVALID')
    }
  })

  it('honours a model-raised needs_claude', async () => {
    const result = await codexSynthesizer(
      runner(
        0,
        JSON.stringify({
          pages_touched: [],
          needs_claude: true,
          reason: 'needs human judgement',
        }),
      ),
    ).synthesize(input)
    expect(result.needsClaude).toBe(true)
    expect(result.pagesTouched).toEqual([])
  })
})
