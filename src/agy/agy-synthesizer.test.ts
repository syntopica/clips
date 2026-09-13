import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { CodexRunner } from '../codex/codex-runner.ts'
import { AGY_PROMPT_CEILING_BYTES } from './agy-prompt-ceiling-bytes.ts'
import { agySynthesizer } from './agy-synthesizer.ts'

const CLIP_TEMP_PREFIX = 'agy-synth-'

const runner = (
  exitCode: number,
  lastMessage: string | null,
  stderrTail = '',
): CodexRunner => ({
  run: async () => Promise.resolve({ exitCode, lastMessage, stderrTail }),
})

const clipDirectory = async (): Promise<string> => {
  const directory = await mkdtemp(join(tmpdir(), CLIP_TEMP_PREFIX))
  await writeFile(join(directory, 'index.md'), '# clip\n\nBody.\n')
  return directory
}

const wrote = JSON.stringify({
  pages_touched: ['topics/a.md'],
  needs_claude: false,
  reason: 'wrote one page',
})

describe('agySynthesizer', () => {
  it('reports the model it was built with, not the one that reads the page later', async () => {
    const result = await agySynthesizer(
      runner(0, wrote),
      'gemini-3.1-pro-high',
    ).synthesize({
      clipDirectory: await clipDirectory(),
      worktree: '/wt',
      guidance: '',
    })

    expect(result.identity.model).toBe('gemini-3.1-pro-high')
    expect(result.identity.boundary).toBe('agy-accept-edits')
    expect(result.identity.promptSha256).toMatch(/^[0-9a-f]{64}$/)
  })

  it('hashes the prompt it actually sent, clip text included', async () => {
    const one = await agySynthesizer(runner(0, wrote), 'm').synthesize({
      clipDirectory: await clipDirectory(),
      worktree: '/wt',
      guidance: '',
    })
    const other = await mkdtemp(join(tmpdir(), CLIP_TEMP_PREFIX))
    await writeFile(join(other, 'index.md'), '# a different clip\n')
    const second = await agySynthesizer(runner(0, wrote), 'm').synthesize({
      clipDirectory: other,
      worktree: '/wt',
      guidance: '',
    })

    // Two clips through the same model must not share a prompt hash, or the
    // ledger records the template rather than what the model was shown.
    expect(one.identity.promptSha256).not.toBe(second.identity.promptSha256)
  })

  it('has no prompt to hash when the clip could not be read', async () => {
    const result = await agySynthesizer(runner(0, wrote), 'm').synthesize({
      clipDirectory: '/nowhere',
      worktree: '/wt',
      guidance: '',
    })

    expect(result.needsClaude).toBe(true)
    expect(result.identity.promptSha256).toBe('')
  })

  it('refuses a clip too large to spawn, naming both numbers and the remedy', async () => {
    const directory = await mkdtemp(join(tmpdir(), CLIP_TEMP_PREFIX))
    await writeFile(
      join(directory, 'index.md'),
      'x'.repeat(AGY_PROMPT_CEILING_BYTES + 1),
    )
    // Reaching the runner at all would be the bug: `execFile` never spawns at
    // this size, so a run that "succeeds" here proves the check was skipped.
    const unreachable: CodexRunner = {
      run: async () => Promise.reject(new Error('spawn E2BIG')),
    }

    const result = await agySynthesizer(unreachable, 'm').synthesize({
      clipDirectory: directory,
      worktree: '/wt',
      guidance: '',
    })

    expect(result.needsClaude).toBe(true)
    expect(result.pagesTouched).toEqual([])
    expect(result.reason).toContain('512 KB argv ceiling')
    expect(result.reason).toContain('CLIPS_SYNTHESIS_RUNNER=codex')
  })

  it('records no prompt hash for a clip it refused to send', async () => {
    const directory = await mkdtemp(join(tmpdir(), CLIP_TEMP_PREFIX))
    await writeFile(
      join(directory, 'index.md'),
      'x'.repeat(AGY_PROMPT_CEILING_BYTES + 1),
    )

    const result = await agySynthesizer(runner(0, wrote), 'm').synthesize({
      clipDirectory: directory,
      worktree: '/wt',
      guidance: '',
    })

    // The prompt was built and never sent. Hashing it would put a prompt no
    // model saw into the ledger, which is the attribution the 2026-08-03 fix
    // removed.
    expect(result.identity.promptSha256).toBe('')
  })

  it('lets a clip just under the ceiling through', async () => {
    const directory = await mkdtemp(join(tmpdir(), CLIP_TEMP_PREFIX))
    // The instructions share the argv with the clip, so the clip has to be
    // shorter than the ceiling by more than their length for the prompt to fit.
    await writeFile(
      join(directory, 'index.md'),
      'x'.repeat(AGY_PROMPT_CEILING_BYTES - 8 * 1024),
    )

    const result = await agySynthesizer(runner(0, wrote), 'm').synthesize({
      clipDirectory: directory,
      worktree: '/wt',
      guidance: '',
    })

    expect(result.needsClaude).toBe(false)
    expect(result.pagesTouched).toEqual(['topics/a.md'])
  })
})
