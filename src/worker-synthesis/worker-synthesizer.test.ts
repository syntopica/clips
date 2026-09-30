import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { temporaryDir } from '../testing/temporary-dir.ts'
import type { WorkerInferenceAnswer } from './worker-inference-answer.ts'
import type { WorkerSynthesisPort } from './worker-synthesis-port.ts'
import { workerSynthesizer } from './worker-synthesizer.ts'

const ollama = { node: 'n', provider: 'ollama', model: 'qwen3.6:35b' }

type Call = { step: string; prompt: string; reserveBytes: number }

const fakePort = (
  select: WorkerInferenceAnswer,
  write: WorkerInferenceAnswer,
): { port: WorkerSynthesisPort; calls: Call[] } => {
  const calls: Call[] = []
  return {
    calls,
    port: {
      infer: async (step, prompt, _schema, reserveBytes) => {
        calls.push({ step, prompt, reserveBytes })
        return Promise.resolve(step === 'select' ? select : write)
      },
    },
  }
}

const answer = (json: unknown): WorkerInferenceAnswer => ({
  text: JSON.stringify(json),
  executor: ollama,
})

const TOPIC_A = 'topics/a.md'

const chose = answer({
  pages: [TOPIC_A],
  needs_claude: false,
  reason: 'r',
})

const fixture = (): { clip: string; worktree: string } => {
  const clip = temporaryDir('worker-clip-')
  writeFileSync(join(clip, 'index.md'), '---\nurl: https://x\n---\nBody.\n')
  const worktree = temporaryDir('worker-wt-')
  mkdirSync(join(worktree, 'topics'))
  writeFileSync(join(worktree, 'index.md'), '- [[topics/a]] - about a\n')
  writeFileSync(join(worktree, 'topics', 'a.md'), 'old a\n')
  writeFileSync(join(worktree, 'topics', 'c.md'), 'old c\n')
  return { clip, worktree }
}

const run = async (port: WorkerSynthesisPort, guidance = '') => {
  const { clip, worktree } = fixture()
  const result = await workerSynthesizer(port, () => '2026-09-30').synthesize({
    clipDirectory: clip,
    worktree,
    guidance,
  })
  return { result, worktree }
}

describe('workerSynthesizer', () => {
  it('writes the pages the worker returned and names its executor as author', async () => {
    const { port } = fakePort(
      chose,
      answer({
        pages: [
          { path: TOPIC_A, content: 'new a [[topics/b]]' },
          { path: 'topics/b.md', content: 'new b' },
        ],
        needs_claude: false,
        reason: 'wrote two pages',
      }),
    )
    const { result, worktree } = await run(port)

    expect(result.needsClaude).toBe(false)
    expect(result.pagesTouched).toEqual([TOPIC_A, 'topics/b.md'])
    expect(readFileSync(join(worktree, 'topics', 'a.md'), 'utf8')).toBe(
      'new a [[topics/b]]\n',
    )
    expect(readFileSync(join(worktree, 'topics', 'b.md'), 'utf8')).toBe(
      'new b\n',
    )
    // Who the coordinator says answered, not who was asked for.
    expect(result.identity.model).toBe('worker:ollama/qwen3.6:35b')
    expect(result.identity.boundary).toBe('worker-inference-no-tools')
    expect(result.identity.promptSha256).toMatch(/^[0-9a-f]{64}$/)
  })

  it('shows the selection pass the index and the writing pass the chosen page whole', async () => {
    const { port, calls } = fakePort(
      chose,
      answer({ pages: [], needs_claude: false, reason: 'nothing new' }),
    )
    await run(port)

    expect(calls.map((call) => call.step)).toEqual(['select', 'write'])
    expect(calls[0]?.prompt).toContain('[[topics/a]] - about a')
    expect(calls[0]?.prompt).toContain('BEGIN CAPTURED PAGE (UNTRUSTED DATA)')
    expect(calls[1]?.prompt).toContain(
      '--- BEGIN WIKI PAGE topics/a.md ---\nold a',
    )
    expect(calls[1]?.prompt).toContain('topics/c.md')
    expect(calls[1]?.prompt).toContain('updated (2026-09-30)')
    // Room for the shown page to come back rewritten, plus a new one.
    expect(calls[1]?.reserveBytes).toBe(6 + 16 * 1024)
  })

  it('shows a page the selection named without its suffix', async () => {
    const { port, calls } = fakePort(
      answer({ pages: ['topics/a'], needs_claude: false, reason: 'r' }),
      answer({ pages: [], needs_claude: false, reason: 'nothing new' }),
    )
    await run(port)

    expect(calls[1]?.prompt).toContain('--- BEGIN WIKI PAGE topics/a.md ---')
  })

  it('refuses a page outside the page directories and writes nothing', async () => {
    const { port } = fakePort(
      chose,
      answer({
        pages: [
          { path: TOPIC_A, content: 'new a' },
          { path: '../outside.md', content: 'x' },
        ],
        needs_claude: false,
        reason: 'r',
      }),
    )
    const { result, worktree } = await run(port)

    expect(result.needsClaude).toBe(true)
    expect(result.reason).toMatch(
      /refused: "..\/outside.md" is not a plain relative path/,
    )
    // All or nothing: the valid page in the same answer was not written either.
    expect(readFileSync(join(worktree, 'topics', 'a.md'), 'utf8')).toBe(
      'old a\n',
    )
    expect(result.identity.model).toBe('worker:ollama/qwen3.6:35b')
  })

  it('refuses rewriting the index, which is not a page', async () => {
    const { port } = fakePort(
      chose,
      answer({
        pages: [{ path: 'index.md', content: 'x' }],
        needs_claude: false,
        reason: 'r',
      }),
    )
    const { result } = await run(port)

    expect(result.needsClaude).toBe(true)
    expect(result.reason).toMatch(/is outside the page directories/)
  })

  it('refuses rewriting an existing page the model was not shown', async () => {
    const { port } = fakePort(
      chose,
      answer({
        pages: [{ path: 'topics/c.md', content: 'clobbered' }],
        needs_claude: false,
        reason: 'r',
      }),
    )
    const { result, worktree } = await run(port)

    expect(result.needsClaude).toBe(true)
    expect(result.reason).toMatch(
      /topics\/c.md already exists and was not among/,
    )
    expect(readFileSync(join(worktree, 'topics', 'c.md'), 'utf8')).toBe(
      'old c\n',
    )
  })

  it('escalates a job with no answer as an unreported author', async () => {
    const { port } = fakePort(chose, {
      failure: 'worker job j ended without an answer',
    })
    const { result } = await run(port)

    expect(result.needsClaude).toBe(true)
    expect(result.reason).toBe('writing: worker job j ended without an answer')
    // Nobody answered, so nobody is named - which the grade lane refuses.
    expect(result.identity.model).toBe('worker:unreported')
  })

  it('stops after the selection pass when the model asks for a human', async () => {
    const { port, calls } = fakePort(
      answer({ pages: [], needs_claude: true, reason: 'off-topic' }),
      answer({ pages: [], needs_claude: false, reason: 'r' }),
    )
    const { result } = await run(port)

    expect(result.needsClaude).toBe(true)
    expect(result.reason).toBe('off-topic')
    expect(calls).toHaveLength(1)
  })

  it('escalates an answer of the wrong shape as PROMPT_OUTPUT_INVALID', async () => {
    const { port } = fakePort(chose, {
      text: 'I wrote the page.',
      executor: ollama,
    })
    const { result } = await run(port)

    expect(result.needsClaude).toBe(true)
    expect(result.reason).toMatch(/PROMPT_OUTPUT_INVALID/)
  })

  it('escalates a clip it cannot read without sending anything', async () => {
    const { port, calls } = fakePort(chose, chose)
    const result = await workerSynthesizer(port).synthesize({
      clipDirectory: temporaryDir('worker-empty-'),
      worktree: temporaryDir('worker-wt-'),
      guidance: '',
    })

    expect(result.needsClaude).toBe(true)
    expect(result.identity.promptSha256).toBe('')
    expect(calls).toEqual([])
  })
})
