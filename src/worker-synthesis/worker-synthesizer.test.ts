import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { fakeWorkerSynthesisPort as fakePort } from '../testing/fake-worker-synthesis-port.ts'
import { ollamaWorkerAnswer as answer } from '../testing/ollama-worker-answer.ts'
import { runWorkerSynthesisFixture as run } from '../testing/run-worker-synthesis-fixture.ts'
import { temporaryDir } from '../testing/temporary-dir.ts'
import { workerSynthesizer } from './worker-synthesizer.ts'

const TOPIC_A = 'topics/a.md'

const chose = answer({ pages: [TOPIC_A], needs_claude: false, reason: 'r' })

describe('workerSynthesizer', () => {
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
      ...answer({}),
      text: 'I wrote the page.',
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
