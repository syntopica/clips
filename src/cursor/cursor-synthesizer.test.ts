import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { CodexRunner } from '../codex/codex-runner.ts'
import { CURSOR_IDENTITY_MODEL } from './cursor-identity-model.ts'
import { CURSOR_PROMPT_CEILING_BYTES } from './cursor-prompt-ceiling-bytes.ts'
import { cursorSynthesizer } from './cursor-synthesizer.ts'

const runner = (
  exitCode: number,
  lastMessage: string | null,
  stderrTail = '',
): CodexRunner => ({
  run: async () => Promise.resolve({ exitCode, lastMessage, stderrTail }),
})

const clipDirectory = async (body = 'Body.\n'): Promise<string> => {
  const directory = await mkdtemp(join(tmpdir(), 'cursor-synth-'))
  await writeFile(join(directory, 'index.md'), `# clip\n\n${body}`)
  return directory
}

const wrote = JSON.stringify({
  pages_touched: ['topics/a.md'],
  needs_claude: false,
  reason: 'wrote one page',
})

const synthesize = async (run: CodexRunner, body?: string) =>
  cursorSynthesizer(run).synthesize({
    clipDirectory: await clipDirectory(body),
    worktree: '/wt',
    guidance: '',
  })

describe('cursorSynthesizer', () => {
  it('names the transport as the author, not the model string', async () => {
    // Which model answered is the CLI's own configuration and this process
    // never reads it back, so the ledger records the claim it can support - and
    // it is the value gradeTiersOfAuthor recognises later.
    const result = await synthesize(runner(0, wrote))

    expect(result.identity.model).toBe(CURSOR_IDENTITY_MODEL)
    expect(result.identity.boundary).toBe('cursor-force')
    expect(result.pagesTouched).toEqual(['topics/a.md'])
    expect(result.needsClaude).toBe(false)
  })

  it('hashes the prompt the model was actually sent', async () => {
    const result = await synthesize(runner(0, wrote))

    expect(result.identity.promptSha256).toMatch(/^[0-9a-f]{64}$/)
  })

  it('escalates a clip it cannot read, with no prompt hash', async () => {
    const empty = await mkdtemp(join(tmpdir(), 'cursor-synth-'))
    const result = await cursorSynthesizer(runner(0, wrote)).synthesize({
      clipDirectory: empty,
      worktree: '/wt',
      guidance: '',
    })

    expect(result.needsClaude).toBe(true)
    // A hash of "" would read exactly like a real one for a prompt never sent.
    expect(result.identity.promptSha256).toBe('')
  })

  it('refuses an oversized clip before spawning, naming both numbers', async () => {
    const result = await synthesize(
      runner(0, wrote),
      'x'.repeat(CURSOR_PROMPT_CEILING_BYTES + 1),
    )

    expect(result.needsClaude).toBe(true)
    expect(result.reason).toMatch(/over cursor's 512 KB prompt ceiling/)
    expect(result.identity.promptSha256).toBe('')
  })

  it('points an oversized clip at codex rather than telling anyone to split it', async () => {
    // A clip is captured, not authored here, so "make it smaller" is advice
    // nobody can take. codex is handed the path instead of the text.
    const result = await synthesize(
      runner(0, wrote),
      'x'.repeat(CURSOR_PROMPT_CEILING_BYTES + 1),
    )

    expect(result.reason).toMatch(/CLIPS_SYNTHESIS_RUNNER=codex/)
  })

  it('escalates a failed run rather than writing to the brain', async () => {
    const result = await synthesize(runner(1, null, 'boom'))

    expect(result.needsClaude).toBe(true)
    expect(result.reason).toMatch(/cursor exited 1: boom/)
  })

  it('escalates an envelope carrying no verdict, and says what came back', async () => {
    // The shape an oversized or refused run produces: exit 0, nothing readable.
    const result = await synthesize(runner(0, null, 'empty stdout'))

    expect(result.needsClaude).toBe(true)
    expect(result.reason).toMatch(/PROMPT_OUTPUT_INVALID/)
    expect(result.reason).toMatch(/empty stdout/)
  })
})
