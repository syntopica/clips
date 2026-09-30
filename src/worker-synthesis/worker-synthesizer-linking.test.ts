import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { fakeWorkerSynthesisPort as fakePort } from '../testing/fake-worker-synthesis-port.ts'
import { ollamaWorkerAnswer as answer } from '../testing/ollama-worker-answer.ts'
import { runWorkerSynthesisFixture as run } from '../testing/run-worker-synthesis-fixture.ts'

const TOPIC_A = 'topics/a.md'
const TOPIC_B = 'topics/b.md'

const chose = answer({ pages: [TOPIC_A], needs_claude: false, reason: 'r' })

describe('workerSynthesizer new-page linking', () => {
  it('writes the pages the worker returned and names its executor as author', async () => {
    const { port } = fakePort(
      chose,
      answer({
        pages: [
          { path: TOPIC_A, content: 'new a' },
          { path: TOPIC_B, content: 'new b', link_from: TOPIC_A },
        ],
        needs_claude: false,
        reason: 'wrote two pages',
      }),
    )
    const { result, worktree } = await run(port)

    expect(result.needsClaude).toBe(false)
    expect(result.pagesTouched).toEqual([TOPIC_A, TOPIC_B])
    // The engine linked the new page from the rewrite, not from the old file.
    expect(readFileSync(join(worktree, 'topics', 'a.md'), 'utf8')).toBe(
      'new a\n\nSee also: [[topics/b]]\n',
    )
    expect(readFileSync(join(worktree, 'topics', 'b.md'), 'utf8')).toBe(
      'new b\n',
    )
    // Who the coordinator says answered, not who was asked for.
    expect(result.identity.model).toBe('worker:ollama/qwen3.6:35b')
    expect(result.identity.boundary).toBe('worker-inference-no-tools')
    expect(result.identity.promptSha256).toMatch(/^[0-9a-f]{64}$/)
  })

  it('links a new page from a shown page the answer did not rewrite', async () => {
    const { port } = fakePort(
      chose,
      answer({
        pages: [{ path: TOPIC_B, content: 'new b', link_from: TOPIC_A }],
        needs_claude: false,
        reason: 'r',
      }),
    )
    const { result, worktree } = await run(port)

    expect(result.pagesTouched).toEqual([TOPIC_B, TOPIC_A])
    expect(readFileSync(join(worktree, 'topics', 'a.md'), 'utf8')).toBe(
      'old a\n\nSee also: [[topics/b]]\n',
    )
  })

  it('refuses a new page that names no page to link it from', async () => {
    const { port } = fakePort(
      chose,
      answer({
        pages: [{ path: TOPIC_B, content: 'new b' }],
        needs_claude: false,
        reason: 'r',
      }),
    )
    const { result, worktree } = await run(port)

    expect(result.needsClaude).toBe(true)
    expect(result.reason).toMatch(/names no page to link it from/)
    expect(existsSync(join(worktree, 'topics', 'b.md'))).toBe(false)
  })

  it('refuses a link from a page the model was not shown', async () => {
    const { port } = fakePort(
      chose,
      answer({
        pages: [{ path: TOPIC_B, content: 'new b', link_from: 'topics/c.md' }],
        needs_claude: false,
        reason: 'r',
      }),
    )
    const { result, worktree } = await run(port)

    expect(result.needsClaude).toBe(true)
    expect(result.reason).toMatch(
      /names topics\/c.md to link it from, which is not a page the model was shown/,
    )
    expect(readFileSync(join(worktree, 'topics', 'c.md'), 'utf8')).toBe(
      'old c\n',
    )
  })
})
